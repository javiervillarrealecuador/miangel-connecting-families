import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yxngkkfhupkmzmokyigh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmdra2ZodXBrbXptb2t5aWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDc4MzcsImV4cCI6MjA5MzI4MzgzN30.2Eqe0LSxJw1JIPBixhp6tn8iO8EmJqh9kgOknwVvNzw"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkResumenesColumns() {
  console.log('Testing select for fecha_generacion...')
  const { data: d1, error: e1 } = await supabase
    .from('resumenes_consolidados')
    .select('fecha_generacion')
    .limit(1)

  if (e1) {
    console.log('❌ "fecha_generacion" does NOT exist or has error:', e1.message)
  } else {
    console.log('✅ "fecha_generacion" EXISTS!')
  }

  console.log('Testing select for created_at...')
  const { data: d2, error: e2 } = await supabase
    .from('resumenes_consolidados')
    .select('created_at')
    .limit(1)

  if (e2) {
    console.log('❌ "created_at" does NOT exist or has error:', e2.message)
  } else {
    console.log('✅ "created_at" EXISTS!')
  }
}

checkResumenesColumns()
