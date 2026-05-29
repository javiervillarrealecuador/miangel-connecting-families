import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const arrayColumns = [
  'contextos_validos',
  'variaciones',
  'adaptaciones',
  'materiales_necesarios',
  'alternativas_materiales',
  'mejora_habilidades',
  'beneficios_esperados',
  'riesgos_potenciales',
  'contraindicaciones',
  'precauciones',
  'intereses_especiales_relacionados',
  'refuerzadores_sugeridos'
];

function cleanArrayValue(arr) {
  if (!arr || !Array.isArray(arr)) return arr;
  return arr.map(item => {
    if (typeof item === 'string') {
      let cleaned = item.trim();
      // Remove trailing "]::text[" or "]::text" if present
      if (cleaned.endsWith(']::text[')) {
        cleaned = cleaned.substring(0, cleaned.length - 8).trim();
      } else if (cleaned.endsWith(']::text')) {
        cleaned = cleaned.substring(0, cleaned.length - 7).trim();
      }
      return cleaned;
    }
    return item;
  }).filter(item => item !== null && item !== '');
}

async function fixDatabaseArrays() {
  console.log("Fetching all activities from database...");
  const { data: activities, error } = await supabase
    .from('actividades')
    .select('*');

  if (error) {
    console.error("Error fetching activities:", error);
    return;
  }

  console.log(`Found ${activities.length} activities. Scanning and cleaning arrays...`);

  let updatedCount = 0;

  for (const act of activities) {
    const updateObj = {};
    let needsUpdate = false;

    for (const col of arrayColumns) {
      const original = act[col];
      if (original && Array.isArray(original)) {
        const cleaned = cleanArrayValue(original);
        // Compare original and cleaned to see if anything changed
        if (JSON.stringify(original) !== JSON.stringify(cleaned)) {
          updateObj[col] = cleaned;
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('actividades')
        .update(updateObj)
        .eq('id', act.id);

      if (updateError) {
        console.error(`Error updating activity ID ${act.id} (${act.nombre}):`, updateError);
      } else {
        updatedCount++;
        console.log(`Cleaned activity: "${act.nombre}"`);
      }
    }
  }

  console.log(`=== MIGRATION COMPLETE ===`);
  console.log(`Successfully cleaned and updated ${updatedCount} activities.`);
}

fixDatabaseArrays();
