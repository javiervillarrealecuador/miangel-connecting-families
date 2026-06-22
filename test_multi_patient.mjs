import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yxngkkfhupkmzmokyigh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmdra2ZodXBrbXptb2t5aWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDc4MzcsImV4cCI6MjA5MzI4MzgzN30.2Eqe0LSxJw1JIPBixhp6tn8iO8EmJqh9kgOknwVvNzw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const email = 'variascosasjavier@gmail.com';
  const password = '1234567';

  console.log('Iniciando sesión como:', email);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) return console.error('Error login:', authError.message);
  
  const userId = authData.user.id;

  console.log('\n--- 1. OBTENIENDO LISTA DE PACIENTES ---');
  const { data: teamData } = await supabase
    .from('equipo_pai')
    .select('id, familia_id, persona_autismo_id, personas_autismo(full_name)')
    .eq('user_id', userId);

  // Deduplicamos (como hace React ahora)
  const uniquePatients = Array.from(new Map(teamData.map(item => [item.persona_autismo_id, item])).values());
  
  if (uniquePatients.length < 2) {
      console.log("No hay múltiples pacientes para probar.");
      return;
  }
  
  const elioth = uniquePatients.find(p => p.personas_autismo.full_name.includes('Elioth'));
  const maria = uniquePatients.find(p => p.personas_autismo.full_name.includes('María'));

  console.log(`Pacientes detectados: 1) ${elioth.personas_autismo.full_name} 2) ${maria.personas_autismo.full_name}`);

  console.log('\n--- 2. CREANDO DATOS AISLADOS (SIMULANDO LA APP) ---');
  // Crear observacion para Elioth
  console.log(`Creando observación clínica para ${elioth.personas_autismo.full_name}...`);
  await supabase.from('observaciones_diarias').insert({
    familia_id: elioth.familia_id,
    persona_autismo_id: elioth.persona_autismo_id,
    user_id: userId,
    tipo: 'comportamiento',
    nota: 'Elioth logró mantener contacto visual durante la terapia de juego hoy.',
    fecha_registro: new Date().toISOString()
  });

  // Crear observacion para Maria
  console.log(`Creando observación clínica para ${maria.personas_autismo.full_name}...`);
  await supabase.from('observaciones_diarias').insert({
    familia_id: maria.familia_id,
    persona_autismo_id: maria.persona_autismo_id,
    user_id: userId,
    tipo: 'comportamiento',
    nota: 'María mostró sensibilidad al ruido en el recreo.',
    fecha_registro: new Date().toISOString()
  });

  console.log('\n--- 3. PRUEBA DE CAMBIO DE CONTEXTO ---');
  
  // Simulamos que el usuario selecciona a Elioth en el dropdown
  console.log(`>>> Usuario selecciona a: ${elioth.personas_autismo.full_name}`);
  const { data: obsElioth } = await supabase
    .from('observaciones_diarias')
    .select('nota')
    .eq('persona_autismo_id', elioth.persona_autismo_id)
    .order('created_at', { ascending: false })
    .limit(1);
    
  console.log(`Datos mostrados en pantalla: "${obsElioth[0]?.nota}"`);

  // Simulamos que el usuario selecciona a Maria en el dropdown
  console.log(`>>> Usuario selecciona a: ${maria.personas_autismo.full_name}`);
  const { data: obsMaria } = await supabase
    .from('observaciones_diarias')
    .select('nota')
    .eq('persona_autismo_id', maria.persona_autismo_id)
    .order('created_at', { ascending: false })
    .limit(1);
    
  console.log(`Datos mostrados en pantalla: "${obsMaria[0]?.nota}"`);

  console.log('\n--- RESULTADO ---');
  if (obsElioth[0]?.nota !== obsMaria[0]?.nota) {
      console.log('✅ ÉXITO: El aislamiento de datos por paciente funciona perfectamente. Los datos no se cruzan.');
  } else {
      console.log('❌ ERROR: Los datos se están cruzando.');
  }
}

runTest();
