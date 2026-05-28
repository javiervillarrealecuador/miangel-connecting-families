import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '../src/data/manuales_clinicos/aba-tratamiento-autismo.pdf');
const dataBuffer = fs.readFileSync(pdfPath);
const uint8Array = new Uint8Array(dataBuffer);

async function test() {
  try {
    const parser = new pdf.PDFParse(uint8Array);
    await parser.load();
    const result = await parser.getText();
    console.log('--- TYPE AND KEYS ---');
    console.log('typeof result:', typeof result);
    console.log('Is array?:', Array.isArray(result));
    if (result && typeof result === 'object') {
      console.log('Object keys:', Object.keys(result));
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
