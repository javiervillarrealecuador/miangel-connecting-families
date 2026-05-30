import fetch from 'node-fetch';

async function testN8nConnection() {
  const url = 'http://localhost:5678';
  console.log(`Checking connection to n8n at ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`✅ Connection successful! Status code: ${res.status}`);
    console.log(`n8n is running locally.`);
  } catch (err) {
    console.warn(`⚠️ Could not connect to local n8n server: ${err.message}`);
    console.warn(`This is normal if n8n is not running locally right now, or if it is running in a different environment (like a remote server or not started yet).`);
  }
}

testN8nConnection();
