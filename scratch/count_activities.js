import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function countActivities() {
  const { count, error } = await supabase
    .from('actividades')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("Error counting activities:", error);
    return;
  }

  console.log(`Total activities in 'actividades' table: ${count}`);
}

countActivities();
