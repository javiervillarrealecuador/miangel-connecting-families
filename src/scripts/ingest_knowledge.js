import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
let pdf = require('pdf-parse');

// Si la librería viene envuelta en un objeto default (común en ESM/CJS mix)
if (typeof pdf !== 'function' && pdf.default) {
    pdf = pdf.default;
}

// Configuración de __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Configuración
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_AI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const MANUALS_DIR = path.join(__dirname, '../data/manuales_clinicos');

async function chunkText(text, size = 1200) {
    const chunks = [];
    const sentences = text.split(/[.!?]\s/);
    let currentChunk = "";

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length < size) {
            currentChunk += sentence + ". ";
        } else {
            chunks.push(currentChunk.trim());
            currentChunk = sentence + ". ";
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
}

async function processFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`\n📄 Procesando: ${fileName}...`);
    
    const dataBuffer = fs.readFileSync(filePath);
    
    let text = "";
    let numpages = 1;
    
    if (typeof pdf === 'function') {
        const data = await pdf(dataBuffer);
        text = data.text;
        numpages = data.numpages || 1;
    } else if (pdf && pdf.PDFParse) {
        const uint8Array = new Uint8Array(dataBuffer);
        const parser = new pdf.PDFParse(uint8Array);
        await parser.load();
        const parsed = await parser.getText();
        text = parsed.text || "";
        numpages = parsed.total || 1;
    } else {
        throw new Error("No se pudo identificar una función o clase de parseo de PDF válida.");
    }
    
    console.log(`   - Texto extraído (${numpages} páginas). Fragmentando...`);
    const chunks = await chunkText(text);
    console.log(`   - Generados ${chunks.length} fragmentos.`);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            // 1. Generar Vector
            const result = await model.embedContent(chunk);
            const embedding = result.embedding.values;

            // 2. Guardar en Supabase
            const { error } = await supabase
                .from('conocimiento_clinico')
                .insert({
                    titulo_documento: fileName,
                    contenido_fragmento: chunk,
                    embedding: embedding,
                    metadatos: {
                        source: 'backend_ingest',
                        page_estimate: Math.floor(i / (chunks.length / numpages)) + 1
                    }
                });

            if (error) throw error;
            process.stdout.write(`\r   - Progreso: ${Math.round(((i + 1) / chunks.length) * 100)}%`);
        } catch (err) {
            console.error(`\n   ❌ Error en fragmento ${i}:`, err.message);
        }
    }
    console.log(`\n   ✅ ${fileName} indexado correctamente.`);
}

async function run() {
    console.log('🚀 Iniciando Ingesta de Conocimiento Clínico mIAngel...');
    
    if (!fs.existsSync(MANUALS_DIR)) {
        console.error('❌ No se encontró la carpeta de manuales.');
        return;
    }

    const files = fs.readdirSync(MANUALS_DIR).filter(f => f.endsWith('.pdf'));
    
    if (files.length === 0) {
        console.log('⚠️ No hay archivos PDF en la carpeta src/data/manuales_clinicos.');
        return;
    }

    for (const file of files) {
        await processFile(path.join(MANUALS_DIR, file));
    }

    console.log('\n✨ Proceso finalizado. El Cerebro Clínico ha sido actualizado.');
}

run();
