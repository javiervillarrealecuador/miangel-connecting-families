import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testContextInsertion() {
  console.log("Testing if we can insert a custom context in 'contextos_validos'...");
  
  // We'll create a temporary mock activity and try to insert it
  const mockActivity = {
    nombre: "Actividad de Prueba Contextos",
    descripcion: "Prueba de inserción de contexto personalizado",
    tipo: "social",
    area: "habilidades_sociales",
    contextos_validos: ["restaurante", "fiesta_infantil", "hogar"], // new contexts
    edad_minima: 4,
    edad_maxima: 10,
    nivel_apoyo_minimo: "nivel_1",
    nivel_apoyo_maximo: "nivel_3",
    nivel_evidencia: "moderada",
    creada_por: "31786538-fff6-487a-a881-1cbf90611a6e",
    activa: false, // keep it inactive so it doesn't show in production
    version: 1
  };

  const { data, error } = await supabase
    .from('actividades')
    .insert([mockActivity])
    .select();

  if (error) {
    console.error("❌ Insertion failed! This means there is a check constraint restricting contexts_validos elements:", error);
  } else {
    console.log("✅ Insertion successful! There is NO check constraint on contexts_validos values.", data);
    
    // Clean up by deleting the temporary activity
    const { error: deleteError } = await supabase
      .from('actividades')
      .delete()
      .eq('id', data[0].id);
      
    if (deleteError) {
      console.error("Error cleaning up:", deleteError);
    } else {
      console.log("Cleanup successful.");
    }
  }
}

testContextInsertion();
