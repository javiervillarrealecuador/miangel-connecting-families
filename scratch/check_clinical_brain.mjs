import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yxngkkfhupkmzmokyigh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmdra2ZodXBrbXptb2t5aWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDc4MzcsImV4cCI6MjA5MzI4MzgzN30.2Eqe0LSxJw1JIPBixhp6tn8iO8EmJqh9kgOknwVvNzw"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkClinicalBrain() {
  console.log('--- VERIFICANDO EL CEREBRO CLÍNICO (conocimiento_clinico) ---')
  
  // 1. Verificar si podemos consultar la tabla
  const { data: countData, error: countError, count } = await supabase
    .from('conocimiento_clinico')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Error al acceder a la tabla "conocimiento_clinico":', countError.message)
    console.log('Es posible que la tabla no esté creada en tu base de datos de Supabase.')
    return
  }

  console.log(`✅ Conexión exitosa a la tabla "conocimiento_clinico".`)
  console.log(`📊 Número de fragmentos indexados: ${count} registros.`)

  // 2. Obtener una muestra si hay datos
  if (count > 0) {
    const { data: sampleData, error: sampleError } = await supabase
      .from('conocimiento_clinico')
      .select('id, titulo_documento, contenido_fragmento, metadatos, created_at')
      .limit(3)

    if (sampleError) {
      console.error('❌ Error al obtener muestra de datos:', sampleError.message)
    } else {
      console.log('\n📄 Muestra de fragmentos indexados en la base de datos:')
      sampleData.forEach((row, index) => {
        console.log(`\n--- Fragmento ${index + 1} ---`)
        console.log(`ID: ${row.id}`)
        console.log(`Origen: ${row.titulo_documento}`)
        console.log(`Creado el: ${row.created_at}`)
        console.log(`Metadatos:`, row.metadatos)
        console.log(`Texto (primeros 150 caracteres): "${row.contenido_fragmento.substring(0, 150)}..."`)
      })
    }
  } else {
    console.log('\n⚠️ La tabla está vacía. Debes correr el ingestor para poblarla:')
    console.log('   node src/scripts/ingest_knowledge.js')
  }

  // 3. Verificar si hay documentos validados
  console.log('\n--- VERIFICANDO DOCUMENTOS VALIDADOS ---')
  const { data: docData, error: docError } = await supabase
    .from('documentos_validados')
    .select('id, titulo, autor, url_archivo')
    .limit(5)

  if (docError) {
    console.error('❌ Error al acceder a la tabla "documentos_validados":', docError.message)
  } else {
    console.log(`📊 Encontrados ${docData.length} registros en documentos_validados.`)
    docData.forEach((doc, index) => {
      console.log(`  - Doc ${index + 1}: "${doc.titulo}" por ${doc.autor || 'Desconocido'}`)
    })
  }
}

checkClinicalBrain()
