import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yxngkkfhupkmzmokyigh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmdra2ZodXBrbXptb2t5aWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDc4MzcsImV4cCI6MjA5MzI4MzgzN30.2Eqe0LSxJw1JIPBixhp6tn8iO8EmJqh9kgOknwVvNzw"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAlerts() {
  console.log('Checking alerts...')
  const { data, error } = await supabase
    .from('alertas')
    .select('*')

  if (error) {
    console.error('Error:', error)
  } else {
    console.log(`Found ${data.length} alerts.`)
  }
}

checkAlerts()
