import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GOOGLE_AI_KEY;

async function listModels() {
  try {
    console.log('Fetching available models using fetch...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
      console.log('Available models:');
      data.models.forEach(m => {
        console.log(`- ${m.name} (methods: ${m.supportedGenerationMethods.join(', ')})`);
      });
    } else {
      console.log('No models returned. Response:', data);
    }
  } catch (e) {
    console.error('Error listing models:', e);
  }
}

listModels();
