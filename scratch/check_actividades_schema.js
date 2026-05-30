import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActividadesSchema() {
  console.log("Fetching a sample activity...");
  const { data, error } = await supabase
    .from('actividades')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching activity:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Sample Activity:", JSON.stringify(data[0], null, 2));
    console.log("\nFields and Types:");
    for (const key of Object.keys(data[0])) {
      const val = data[0][key];
      console.log(`- ${key}: ${typeof val} (sample: ${val})`);
    }
  } else {
    console.log("No activities found in table!");
  }
}

checkActividadesSchema();
