import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const sqlPath = 'c:\\Users\\LENOVO\\OneDrive - Universidad Politécnica Estatal del Carchi\\PUBLICA\\BACK EMPRESAS\\CLASES\\4. MARKETING DIGITAL\\CURSO LABORA IA\\miangel-connecting-families\\INSERT_115_FINAL_DEFINITIVO.sql';

// Helper to parse values taking single quotes into account
function parseSqlValues(valuesStr) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let inArray = false;
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    if (char === "'" && (i === 0 || valuesStr[i-1] !== '\\')) {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '[' && !inQuotes) {
      inArray = true;
      current += char;
    } else if (char === ']' && !inQuotes) {
      inArray = false;
      current += char;
    } else if (char === ',' && !inQuotes && !inArray) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current) {
    values.push(current.trim());
  }
  return values;
}

function parseSqlArray(str) {
  if (!str) return [];
  let cleanedStr = str.trim();
  if (cleanedStr.toLowerCase() === 'null') return [];
  
  // Strip trailing PostgreSQL type cast suffix like ::text[] or ::varchar[]
  cleanedStr = cleanedStr.replace(/::[a-z0-9_\[\]]+$/i, '').trim();
  
  const match = cleanedStr.match(/ARRAY\s*\[(.*)\]/i);
  if (match) {
    const itemsStr = match[1];
    const items = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < itemsStr.length; i++) {
      const char = itemsStr[i];
      if (char === "'" && (i === 0 || itemsStr[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        items.push(cleanVal(current));
        current = '';
      } else {
        current += char;
      }
    }
    if (current) {
      items.push(cleanVal(current));
    }
    return items.filter(x => x !== null && x !== '');
  }
  
  // If it's single quote string, split or wrap
  const cleaned = cleanVal(str);
  if (cleaned) {
    return [cleaned];
  }
  return [];
}

function cleanVal(str) {
  if (!str) return null;
  let val = str.trim();
  if (val.toLowerCase() === 'null') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.substring(1, val.length - 1);
  }
  // Unescape single quotes
  val = val.replace(/''/g, "'");
  return val;
}

function parseBool(str) {
  const cleaned = cleanVal(str);
  if (cleaned === null) return false;
  return cleaned.toLowerCase() === 'true';
}

function parseNum(str) {
  const cleaned = cleanVal(str);
  if (cleaned === null) return null;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

async function run() {
  console.log("Reading SQL file...");
  const content = fs.readFileSync(sqlPath, 'utf-8');
  const lines = content.split('\n');
  
  const parsedRecords = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('INSERT INTO actividades')) {
      const match = line.match(/VALUES\s*\((.*)\);?\s*$/i);
      if (!match) continue;
      
      const valuesStr = match[1];
      const rawValues = parseSqlValues(valuesStr);
      
      // Extract columns and map them
      const nombre = cleanVal(rawValues[0]);
      const descripcion = cleanVal(rawValues[1]);
      const codigo_actividad = cleanVal(rawValues[2]);
      
      // Rest of the fields:
      // area and tipo need matching mapping
      const rawTipo = cleanVal(rawValues[3]);
      const rawArea = cleanVal(rawValues[4]);
      
      // Determine mapped area
      let area = 'motor_gruesa';
      if (rawArea === 'Comunicacion') {
        area = 'habilidades_comunicativas';
      } else if (rawArea === 'Cognitivo') {
        area = 'cognitiva';
      } else if (rawArea === 'Social') {
        area = 'habilidades_sociales';
      } else if (rawArea === 'Sensorial') {
        area = 'regulacion_sensorial';
      } else if (rawArea === 'Motor') {
        if (nombre.includes('Escritura') || nombre.includes('Letras') || nombre.includes('Fina')) {
          area = 'motor_fina';
        } else {
          area = 'motor_gruesa';
        }
      }
      
      // Map tipo based on mapped area
      let tipo = 'motor';
      if (area === 'habilidades_comunicativas') {
        tipo = 'comunicacion';
      } else if (area === 'cognitiva') {
        tipo = 'academica';
      } else if (area === 'habilidades_sociales') {
        tipo = 'social';
      } else if (area === 'regulacion_sensorial') {
        tipo = 'sensorial';
      } else if (area === 'motor_gruesa' || area === 'motor_fina') {
        tipo = 'motor';
      }
      
      const subtipo = cleanVal(rawValues[5]);
      const contextos_validos = parseSqlArray(rawValues[6]);
      const ambiente_ideal = cleanVal(rawValues[7]);
      const edad_minima = parseNum(rawValues[8]);
      const edad_maxima = parseNum(rawValues[9]);
      const nivel_apoyo_minimo = cleanVal(rawValues[10]);
      const nivel_apoyo_maximo = cleanVal(rawValues[11]);
      const hipersensible_auditiva = parseBool(rawValues[12]);
      const hipersensible_tactil = parseBool(rawValues[13]);
      const hipersensible_visual = parseBool(rawValues[14]);
      const busca_input_sensorial = parseBool(rawValues[15]);
      const requiere_regulacion_previa = parseBool(rawValues[16]);
      const requiere_lenguaje_verbal = parseBool(rawValues[17]);
      const requiere_motricidad_fina = parseBool(rawValues[18]);
      const requiere_motricidad_gruesa = parseBool(rawValues[19]);
      const requiere_coordinacion = parseBool(rawValues[20]);
      const requiere_atencion_sostenida = parseBool(rawValues[21]);
      const duracion_estimada_minutos = parseNum(rawValues[22]);
      const instrucciones = cleanVal(rawValues[23]);
      const variaciones = parseSqlArray(rawValues[24]);
      const adaptaciones = parseSqlArray(rawValues[25]);
      const materiales_necesarios = parseSqlArray(rawValues[26]);
      const alternativas_materiales = parseSqlArray(rawValues[27]);
      const mejora_habilidades = parseSqlArray(rawValues[28]);
      
      // beneficios_esperados: text[]
      const beneficios_esperados = parseSqlArray(rawValues[29]);
      
      const marco_teorico = cleanVal(rawValues[30]);
      const respaldado_por = cleanVal(rawValues[31]);
      const estudio_referencia = cleanVal(rawValues[32]);
      
      const rawNivelEvidencia = cleanVal(rawValues[33]);
      let nivel_evidencia = 'moderada';
      if (rawNivelEvidencia === 'ALTO') {
        nivel_evidencia = 'fuerte';
      } else if (rawNivelEvidencia === 'MEDIO-ALTO') {
        nivel_evidencia = 'moderada';
      }
      
      const riesgos_potenciales = parseSqlArray(rawValues[34]);
      const contraindicaciones = parseSqlArray(rawValues[35]);
      
      // precauciones: text[]
      const precauciones = parseSqlArray(rawValues[36]);
      
      const requiere_supervision = parseBool(rawValues[37]);
      const intereses_especiales_relacionados = parseSqlArray(rawValues[38]);
      const refuerzadores_sugeridos = parseSqlArray(rawValues[39]);
      const metrica_exito = cleanVal(rawValues[40]);
      const frecuencia_recomendada = cleanVal(rawValues[41]);
      const duracion_programa_semanas = parseNum(rawValues[42]);
      const fuente_origen = cleanVal(rawValues[43]);
      
      let documento_fuente_id = cleanVal(rawValues[44]);
      if (documento_fuente_id && documento_fuente_id.length !== 36) {
        documento_fuente_id = null;
      }
      
      // creada_por: UUID (check if valid UUID, if not use null)
      let creada_por = cleanVal(rawValues[45]);
      if (creada_por && creada_por.length !== 36) {
        creada_por = null;
      }
      
      let verificada_por_especialista = cleanVal(rawValues[46]);
      if (verificada_por_especialista && verificada_por_especialista.toLowerCase() === 'true') {
        verificada_por_especialista = null; 
      }
      
      const fecha_verificacion = cleanVal(rawValues[47]);
      const validada_clinicamente = parseBool(rawValues[48]);
      const activa = parseBool(rawValues[49]);
      const version = parseNum(rawValues[50]) || 1;
      
      parsedRecords.push({
        nombre,
        descripcion,
        codigo_actividad,
        tipo,
        area,
        subtipo,
        contextos_validos,
        ambiente_ideal,
        edad_minima,
        edad_maxima,
        nivel_apoyo_minimo,
        nivel_apoyo_maximo,
        hipersensible_auditiva,
        hipersensible_tactil,
        hipersensible_visual,
        busca_input_sensorial,
        requiere_regulacion_previa,
        requiere_lenguaje_verbal,
        requiere_motricidad_fina,
        requiere_motricidad_gruesa,
        requiere_coordinacion,
        requiere_atencion_sostenida,
        duracion_estimada_minutos,
        instrucciones,
        variaciones,
        adaptaciones,
        materiales_necesarios,
        alternativas_materiales,
        mejora_habilidades,
        beneficios_esperados,
        marco_teorico,
        respaldado_por,
        estudio_referencia,
        nivel_evidencia,
        riesgos_potenciales,
        contraindicaciones,
        precauciones,
        requiere_supervision,
        intereses_especiales_relacionados,
        refuerzadores_sugeridos,
        metrica_exito,
        frecuencia_recomendada,
        duracion_programa_semanas,
        fuente_origen,
        documento_fuente_id,
        creada_por,
        verificada_por_especialista: null, // We'll default to null to be safe or check schema
        fecha_verificacion,
        validada_clinicamente,
        activa,
        version
      });
    }
  }
  
  console.log(`Parsed ${parsedRecords.length} records successfully.`);
  
  // Let's test inserting the first record to make sure it doesn't fail on database constraints
  if (parsedRecords.length > 0) {
    console.log("Dry run inserting the first record...");
    const first = parsedRecords[0];
    
    // Check if exists
    const { data: existing, error: checkError } = await supabase
      .from('actividades')
      .select('id')
      .eq('nombre', first.nombre);
      
    if (checkError) {
      console.error("Check error:", checkError);
      return;
    }
    
    if (existing.length > 0) {
      console.log(`Activity '${first.nombre}' already exists.`);
    } else {
      const { data, error } = await supabase
        .from('actividades')
        .insert([first])
        .select();
        
      if (error) {
        console.error("Insertion error on first record:", error);
        return;
      } else {
        console.log("First record inserted successfully!", data);
      }
    }
  }
  
  // Now batch insert the rest of the records
  console.log("Starting batch insertion of all parsed records...");
  let successCount = 0;
  let skipCount = 0;
  
  const batchSize = 10;
  for (let i = 0; i < parsedRecords.length; i += batchSize) {
    const batch = parsedRecords.slice(i, i + batchSize);
    
    // Filter out already existing ones to avoid conflict
    const batchToInsert = [];
    for (const record of batch) {
      const { data: existing } = await supabase
        .from('actividades')
        .select('id')
        .eq('nombre', record.nombre);
        
      if (existing && existing.length > 0) {
        skipCount++;
      } else {
        batchToInsert.push(record);
      }
    }
    
    if (batchToInsert.length > 0) {
      const { data, error } = await supabase
        .from('actividades')
        .insert(batchToInsert);
        
      if (error) {
        console.error(`Error inserting batch starting at index ${i}:`, error);
      } else {
        successCount += batchToInsert.length;
        console.log(`Inserted batch ${i / batchSize + 1} (${batchToInsert.length} records)`);
      }
    }
  }
  
  console.log(`=== BATCH INSERTION FINISHED ===`);
  console.log(`Successfully inserted: ${successCount} activities`);
  console.log(`Skipped (already exist): ${skipCount} activities`);
}

run();
