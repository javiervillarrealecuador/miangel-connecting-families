import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yxngkkfhupkmzmokyigh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmdra2ZodXBrbXptb2t5aWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDc4MzcsImV4cCI6MjA5MzI4MzgzN30.2Eqe0LSxJw1JIPBixhp6tn8iO8EmJqh9kgOknwVvNzw"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
  console.log('Checking observaciones schema...')
  const { data, error } = await supabase
    .from('observaciones')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching observaciones:', error)
  } else {
    console.log('Sample record:', data[0])
    console.log('Columns:', data[0] ? Object.keys(data[0]) : 'No data')
  }
}

checkSchema()
