import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yxngkkfhupkmzmokyigh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmdra2ZodXBrbXptb2t5aWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDc4MzcsImV4cCI6MjA5MzI4MzgzN30.2Eqe0LSxJw1JIPBixhp6tn8iO8EmJqh9kgOknwVvNzw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'variascosasjavier@gmail.com';
  const password = '1234567';

  console.log('Logging in as:', email);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Error logging in:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log('Logged in successfully. User ID:', userId);

  const { data: family } = await supabase
    .from('familias')
    .select('id')
    .eq('propietario_id', userId)
    .limit(1)
    .single();

  const familyId = family.id;

  console.log('Inserting a distinct Child 2 (María)...');
  const { data: child2, error: child2Error } = await supabase
    .from('personas_autismo')
    .insert({
      familia_id: familyId,
      full_name: 'María Villarreal',
      birth_date: '2018-10-20',
      sexo_nacimiento: 'Mujer',
      identidad_genero: 'Mujer'
    })
    .select()
    .single();

  if (child2Error) console.error('Error Child 2:', child2Error.message);

  console.log('Linking distinct Child 2 to Team...', child2.id);
  const { error: teamError } = await supabase
    .from('equipo_pai')
    .insert({
      familia_id: familyId,
      persona_autismo_id: child2.id,
      user_id: userId,
      rol: 'Padre',
      estado: 'activo',
      puede_ver_observaciones: true,
      puede_crear_observaciones: true,
      puede_ver_objetivos: true,
      puede_editar_objetivos: true,
    });

  if (teamError) console.error('Error Team:', teamError.message);

  const { data: fetchCheck, error: fetchErr } = await supabase
        .from('equipo_pai')
        .select(`
          id, 
          familia_id, 
          persona_autismo_id, 
          rol, 
          personas_autismo(full_name, birth_date)
        `)
        .eq('user_id', userId);

  console.log('Frontend fetch check:', fetchCheck, fetchErr);
  console.log('Done! All test data injected successfully.');
}

main();
