import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUniqueContexts() {
  const { data, error } = await supabase
    .from('actividades')
    .select('contextos_validos');

  if (error) {
    console.error("Error fetching activities:", error);
    return;
  }

  const contexts = new Set();
  
  data.forEach(act => {
    if (act.contextos_validos && Array.isArray(act.contextos_validos)) {
      act.contextos_validos.forEach(ctx => {
        if (ctx) {
          contexts.add(ctx.trim().toLowerCase());
        }
      });
    }
  });

  console.log("=== UNIQUE CONTEXTS / PLACES IN DATABASE ===");
  const sortedContexts = Array.from(contexts).sort();
  sortedContexts.forEach((ctx, index) => {
    console.log(`${index + 1}. ${ctx}`);
  });
}

findUniqueContexts();
