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
    console.log('Load complete.');
    
    console.log('Calling parser.getText()...');
    const result = await parser.getText();
    console.log('Type of result:', typeof result);
    console.log('Keys of result:', result ? Object.keys(result) : 'null/undefined');
    console.log('Result directly:', result);
  } catch (e) {
    console.error('Error during parsing test:', e);
  }
}

test();
