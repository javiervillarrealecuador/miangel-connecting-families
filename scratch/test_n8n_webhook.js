import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhook() {
  console.log("Fetching a sample child and goal from Supabase...");
  
  // Get a child
  const { data: children, error: childError } = await supabase
    .from('personas_autismo')
    .select('id, full_name, familia_id')
    .limit(1);

  if (childError || !children || children.length === 0) {
    console.error("Error fetching child:", childError || "No children found.");
    return;
  }
  const child = children[0];
  console.log(`Using Child: ${child.full_name} (${child.id})`);

  // Get a goal
  const { data: goals, error: goalError } = await supabase
    .from('pai_goals')
    .select('id, title, area')
    .eq('persona_autismo_id', child.id)
    .limit(1);

  let goal = { id: 'mock-goal-id', title: 'Imitación Motora y Juego', area: 'social' };
  if (goalError || !goals || goals.length === 0) {
    console.log("No clinical goals found for child, using mock goal details.");
  } else {
    goal = goals[0];
  }
  console.log(`Using Goal: "${goal.title}" (Area: ${goal.area}, ID: ${goal.id})`);

  // Get a user ID (associated with family if possible)
  const { data: team, error: teamError } = await supabase
    .from('equipo_pai')
    .select('usuario_id')
    .eq('familia_id', child.familia_id)
    .limit(1);
    
  let userId = '31786538-fff6-487a-a881-1cbf90611a6e';
  if (!teamError && team && team.length > 0) {
    userId = team[0].usuario_id;
  }
  console.log(`Using User ID: ${userId}`);

  const payload = {
    ubicacion: 'parque',
    objetivo: goal.title,
    persona_autismo_id: child.id,
    
    // Legacy mapping
    contexto: 'parque',
    objetivo_id: goal.id,
    objetivo_titulo: goal.title,
    child_id: child.id,
    user_id: userId
  };

  console.log("\nPayload to send:", JSON.stringify(payload, null, 2));

  // Try to send to webhook-test first
  const testUrl = 'http://localhost:5678/webhook-test/actividades-sugerir';
  console.log(`\nCalling n8n test webhook at ${testUrl}...`);
  try {
    const res = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`Response Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response Body:`, text);
  } catch (err) {
    console.error(`❌ Call to test webhook failed:`, err.message);
    console.log("Note: n8n test webhook is only active if you clicked 'Listen for test event' in n8n interface.");
  }

  // Try to send to production webhook
  const prodUrl = 'http://localhost:5678/webhook/actividades-sugerir';
  console.log(`\nCalling n8n production webhook at ${prodUrl}...`);
  try {
    const res = await fetch(prodUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`Response Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response Body:`, text);
  } catch (err) {
    console.error(`❌ Call to production webhook failed:`, err.message);
  }
}

testWebhook();
