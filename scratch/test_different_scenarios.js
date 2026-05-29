import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runScenarioTest(name, description, queryBuilderFn, validatorFn) {
  console.log(`\n==================================================`);
  console.log(`TEST ESCENARIO: ${name}`);
  console.log(`Descripción: ${description}`);
  console.log(`==================================================`);

  let query = supabase.from('actividades').select('*');
  query = queryBuilderFn(query);

  const { data, error } = await query;

  if (error) {
    console.error(`❌ Falló la consulta del escenario:`, error);
    return false;
  }

  console.log(`Resultados encontrados: ${data.length}`);
  
  if (data.length === 0) {
    console.warn(`⚠️ Advertencia: No se encontraron actividades para este escenario.`);
    return false;
  }

  // Print first 3 activities as samples
  console.log(`Muestra de actividades encontradas:`);
  data.slice(0, 3).forEach((act, idx) => {
    console.log(`  ${idx + 1}. [${act.area.toUpperCase()}] ${act.nombre}`);
    console.log(`     - Edades: ${act.edad_minima}-${act.edad_maxima} | Soporte: ${act.nivel_apoyo_minimo} a ${act.nivel_apoyo_maximo}`);
    console.log(`     - Contextos: ${act.contextos_validos ? act.contextos_validos.join(', ') : 'ninguno'}`);
    console.log(`     - Sensorial: Aud=${act.hipersensible_auditiva}, Tact=${act.hipersensible_tactil}, Vis=${act.hipersensible_visual}, Seeking=${act.busca_input_sensorial}`);
  });

  const validationResult = validatorFn(data);
  if (validationResult.passed) {
    console.log(`✅ TEST PASÓ: ${validationResult.reason}`);
    return true;
  } else {
    console.error(`❌ TEST FALLÓ: ${validationResult.reason}`);
    return false;
  }
}

async function startTests() {
  console.log("=== INICIANDO SIMULACIÓN DE ESCENARIOS DE BÚSQUEDA DE ACTIVIDADES ===");
  
  let allPassed = true;

  // Escenario 1: Atención Temprana en el Hogar (Niño de 3 años, Nivel de Apoyo 3)
  const passed1 = await runScenarioTest(
    "1. Atención Temprana en el Hogar",
    "Niño de 3 años que requiere alto nivel de apoyo (nivel_3) para realizar actividades en casa.",
    (q) => q
      .lte('edad_minima', 3)
      .gte('edad_maxima', 3)
      .contains('contextos_validos', ['hogar'])
      .eq('nivel_apoyo_maximo', 'nivel_3'),
    (results) => {
      const invalid = results.filter(r => r.edad_minima > 3 || r.edad_maxima < 3 || !r.contextos_validos.includes('hogar') || r.nivel_apoyo_maximo !== 'nivel_3');
      if (invalid.length > 0) {
        return { passed: false, reason: `Se encontraron ${invalid.length} actividades que no cumplen los filtros.` };
      }
      return { passed: true, reason: `Todas las actividades son adecuadas para 3 años en el hogar con nivel de apoyo máximo 3.` };
    }
  );
  if (!passed1) allPassed = false;

  // Escenario 2: Integración Escolar (Niño de 8 años, Nivel de Apoyo 1 o 2)
  const passed2 = await runScenarioTest(
    "2. Integración Escolar en el Aula",
    "Niño de 8 años en etapa escolar con nivel de apoyo leve a moderado (nivel_1 o nivel_2) en contexto 'escuela'.",
    (q) => q
      .lte('edad_minima', 8)
      .gte('edad_maxima', 8)
      .contains('contextos_validos', ['escuela'])
      .in('nivel_apoyo_minimo', ['nivel_1', 'nivel_2']),
    (results) => {
      const invalid = results.filter(r => r.edad_minima > 8 || r.edad_maxima < 8 || !r.contextos_validos.includes('escuela'));
      if (invalid.length > 0) {
        return { passed: false, reason: `Se encontraron ${invalid.length} actividades que violan los límites de edad o contexto.` };
      }
      return { passed: true, reason: `Actividades correctamente acotadas para 8 años en la escuela.` };
    }
  );
  if (!passed2) allPassed = false;

  // Escenario 3: Regulación en el Parque - Buscador Sensorial (Niño de 5 años)
  const passed3 = await runScenarioTest(
    "3. Regulación Sensoriomotora en Parque (Buscador Sensorial)",
    "Niño de 5 años que busca estímulo sensorial activo en el parque.",
    (q) => q
      .lte('edad_minima', 5)
      .gte('edad_maxima', 5)
      .contains('contextos_validos', ['parque'])
      .eq('busca_input_sensorial', true),
    (results) => {
      const invalid = results.filter(r => !r.busca_input_sensorial || !r.contextos_validos.includes('parque'));
      if (invalid.length > 0) {
        return { passed: false, reason: `Se encontraron actividades no sensoriales o fuera del parque.` };
      }
      return { passed: true, reason: `Se encontraron actividades propioceptivas/vestibulares correctas para buscadores sensoriales en parque.` };
    }
  );
  if (!passed3) allPassed = false;

  // Escenario 4: Hipersensibilidad Auditiva y Táctil
  const passed4 = await runScenarioTest(
    "4. Evitación de Sobrecarga Sensorial",
    "Niño con alta hipersensibilidad táctil y auditiva en el hogar. Deben excluirse actividades que las detonen.",
    (q) => q
      .contains('contextos_validos', ['hogar'])
      .eq('hipersensible_auditiva', false)
      .eq('hipersensible_tactil', false),
    (results) => {
      const invalid = results.filter(r => r.hipersensible_auditiva || r.hipersensible_tactil);
      if (invalid.length > 0) {
        return { passed: false, reason: `Se incluyeron actividades que detonan hipersensibilidad auditiva o táctil.` };
      }
      return { passed: true, reason: `Actividades seguras libres de disparadores táctiles/auditivos encontradas.` };
    }
  );
  if (!passed4) allPassed = false;

  // Escenario 5: Comunicación Social y Habilidades Sociales en Clínica
  const passed5 = await runScenarioTest(
    "5. Habilidades Sociales/Comunicación en Clínica",
    "Sesión estructurada en clínica para fortalecer interacciones sociales o comunicación verbal/no-verbal.",
    (q) => q
      .contains('contextos_validos', ['clínica'])
      .in('area', ['habilidades_sociales', 'habilidades_comunicativas']),
    (results) => {
      const invalid = results.filter(r => !['habilidades_sociales', 'habilidades_comunicativas'].includes(r.area) || !r.contextos_validos.includes('clínica'));
      if (invalid.length > 0) {
        return { passed: false, reason: `Actividades fuera del área o contexto clínico.` };
      }
      return { passed: true, reason: `Librería de comunicación y juego cooperativo en clínica verificada.` };
    }
  );
  if (!passed5) allPassed = false;

  console.log(`\n==================================================`);
  console.log(`=== FIN DE PRUEBAS DE ESCENARIOS ===`);
  console.log(`Resultado Global: ${allPassed ? "✅ TODOS LOS ESCENARIOS EXITOSOS" : "❌ HUBO FALLAS EN ESCENARIOS"}`);
  console.log(`==================================================`);

  process.exit(allPassed ? 0 : 1);
}

startTests();
