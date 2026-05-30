import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listActivities() {
  const { data, error } = await supabase
    .from('actividades')
    .select('nombre, area, tipo')
    .order('nombre', { ascending: true })
    .limit(25);

  if (error) {
    console.error("Error fetching activities:", error);
    return;
  }

  console.log("=== Sample of 25 Activities in Database ===");
  data.forEach((act, index) => {
    console.log(`${index + 1}. [${act.area.toUpperCase()} - ${act.tipo.toUpperCase()}] ${act.nombre}`);
  });
}

listActivities();
