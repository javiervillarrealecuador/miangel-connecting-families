import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yxngkkfhupkmzmokyigh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmdra2ZodXBrbXptb2t5aWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDc4MzcsImV4cCI6MjA5MzI4MzgzN30.2Eqe0LSxJw1JIPBixhp6tn8iO8EmJqh9kgOknwVvNzw"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
  console.log('Fetching goal_observations with ALL columns...')
  const { data, error } = await supabase
    .from('goal_observations')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log(`Found ${data.length} records.`)
    data.forEach((r, i) => {
      console.log(`Record ${i}:`, JSON.stringify(r, null, 2))
    })
  }
}

checkData()
