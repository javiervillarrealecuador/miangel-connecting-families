import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const newActivity = {
  nombre: 'Imitación Motora Gruesa',
  descripcion: 'Imitación Motora Gruesa basada en ABA para desarrollo de habilidades en comunicacion.',
  codigo_actividad: null,
  tipo: 'comunicacion', // mapped from 'Intervención ABA' to fit database constraints
  area: 'habilidades_comunicativas', // mapped from 'Comunicacion' to fit database constraints
  subtipo: null,
  contextos_validos: ['hogar', 'escuela', 'parque', 'clínica'],
  ambiente_ideal: null,
  edad_minima: 2,
  edad_maxima: 12,
  nivel_apoyo_minimo: 'nivel_1',
  nivel_apoyo_maximo: 'nivel_3',
  hipersensible_auditiva: false,
  hipersensible_tactil: false,
  hipersensible_visual: false,
  busca_input_sensorial: false,
  requiere_regulacion_previa: false,
  requiere_lenguaje_verbal: true,
  requiere_motricidad_fina: false,
  requiere_motricidad_gruesa: false,
  requiere_coordinacion: false,
  requiere_atencion_sostenida: true,
  duracion_estimada_minutos: 15,
  instrucciones: '1. Preparar entorno para imitación motora gruesa 2. Explicar actividad al niño 3. Demostrar el proceso 4. Invitar participación del niño 5. Proporcionar apoyo según sea necesario 6. Ofrecer refuerzo positivo 7. Repetir actividad regularmente 8. Gradualmente reducir apoyo/andamiaje',
  variaciones: null,
  adaptaciones: null,
  materiales_necesarios: null,
  alternativas_materiales: null,
  mejora_habilidades: ['imitación motora gruesa'],
  beneficios_esperados: ['Mejora en habilidades de comunicacion.', 'Desarrollo de independencia.'],
  marco_teorico: 'Basado en investigación ABA y desarrollo infantil.',
  respaldado_por: 'Research en Lovaas-1996',
  estudio_referencia: null,
  nivel_evidencia: 'fuerte', // mapped from 'ALTO'
  riesgos_potenciales: null,
  contraindicaciones: null,
  precauciones: ['Supervisión apropiada.', 'Materiales seguros.'],
  requiere_supervision: true,
  intereses_especiales_relacionados: null,
  refuerzadores_sugeridos: null,
  metrica_exito: 'Mejora demostrables en imitación motora gruesa',
  frecuencia_recomendada: '3-5 veces por semana',
  duracion_programa_semanas: 4,
  fuente_origen: 'Lovaas-1996',
  documento_fuente_id: null,
  creada_por: '31786538-fff6-487a-a881-1cbf90611a6e',
  verificada_por_especialista: null,
  fecha_verificacion: null,
  validada_clinicamente: true,
  activa: true,
  version: 1
};

async function insertActivity() {
  console.log("Inserting new activity...");
  
  // Check if it already exists to avoid duplicate
  const { data: existing, error: checkError } = await supabase
    .from('actividades')
    .select('id')
    .eq('nombre', newActivity.nombre);

  if (checkError) {
    console.error("Error checking existence:", checkError);
    return;
  }

  if (existing && existing.length > 0) {
    console.log(`Activity '${newActivity.nombre}' already exists in database.`);
    return;
  }

  const { data, error } = await supabase
    .from('actividades')
    .insert([newActivity])
    .select();

  if (error) {
    console.error("Error inserting activity:", error);
  } else {
    console.log("Activity inserted successfully!", data);
  }
}

insertActivity();
