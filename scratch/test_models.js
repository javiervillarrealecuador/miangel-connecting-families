import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GOOGLE_AI_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const models = [
  'text-embedding-004',
  'text-multilingual-embedding-002',
  'embedding-001',
  'models/text-embedding-004',
  'models/embedding-001'
];

async function testModels() {
  for (const modelName of models) {
    try {
      console.log(`Testing model: "${modelName}"...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent("Hola Mundo");
      console.log(`✅ Success for "${modelName}"! Embedding length:`, result.embedding.values.length);
      break; // stop at first working model
    } catch (e) {
      console.error(`❌ Failed for "${modelName}":`, e.message);
    }
  }
}

testModels();
