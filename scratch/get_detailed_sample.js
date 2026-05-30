import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getDetailedSample() {
  const areas = [
    'regulacion_sensorial',
    'cognitiva',
    'motor_gruesa',
    'motor_fina',
    'habilidades_sociales',
    'habilidades_comunicativas'
  ];

  console.log("=== Representative Samples by Area ===");
  
  for (const area of areas) {
    const { data, error } = await supabase
      .from('actividades')
      .select('nombre, edad_minima, edad_maxima, nivel_apoyo_minimo, nivel_apoyo_maximo, nivel_evidencia')
      .eq('area', area)
      .limit(2);

    if (error) {
      console.error(`Error fetching for area ${area}:`, error);
      continue;
    }

    console.log(`\nArea: ${area.toUpperCase()}`);
    data.forEach(act => {
      console.log(`- Nombre: ${act.nombre}`);
      console.log(`  Edades: ${act.edad_minima} a ${act.edad_maxima} años`);
      console.log(`  Apoyo: ${act.nivel_apoyo_minimo} a ${act.nivel_apoyo_maximo}`);
      console.log(`  Evidencia: ${act.nivel_evidencia}`);
    });
  }
}

getDetailedSample();
