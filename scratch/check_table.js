import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
  console.log("Querying unique values from existing records...");
  const { data, error } = await supabase
    .from('actividades')
    .select('tipo, nivel_evidencia, nivel_apoyo_minimo, nivel_apoyo_maximo');

  if (error) {
    console.error("Error:", error);
    return;
  }

  const tipos = new Set(data.map(d => d.tipo));
  const nivelesEvidencia = new Set(data.map(d => d.nivel_evidencia));
  const apoyosMin = new Set(data.map(d => d.nivel_apoyo_minimo));
  const apoyosMax = new Set(data.map(d => d.nivel_apoyo_maximo));

  console.log("Existing 'tipo' values:", Array.from(tipos));
  console.log("Existing 'nivel_evidencia' values:", Array.from(nivelesEvidencia));
  console.log("Existing 'nivel_apoyo_minimo' values:", Array.from(apoyosMin));
  console.log("Existing 'nivel_apoyo_maximo' values:", Array.from(apoyosMax));
}

checkConstraints();
