import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function summarizeActivities() {
  const { data, error } = await supabase
    .from('actividades')
    .select('area, tipo');

  if (error) {
    console.error("Error fetching activities:", error);
    return;
  }

  const areas = {};
  const tipos = {};

  data.forEach(act => {
    areas[act.area] = (areas[act.area] || 0) + 1;
    tipos[act.tipo] = (tipos[act.tipo] || 0) + 1;
  });

  console.log("=== SUMMARY BY AREA ===");
  console.log(JSON.stringify(areas, null, 2));

  console.log("\n=== SUMMARY BY TYPE ===");
  console.log(JSON.stringify(tipos, null, 2));
}

summarizeActivities();
