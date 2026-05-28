import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yxngkkfhupkmzmokyigh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmdra2ZodXBrbXptb2t5aWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDc4MzcsImV4cCI6MjA5MzI4MzgzN30.2Eqe0LSxJw1JIPBixhp6tn8iO8EmJqh9kgOknwVvNzw"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkNestedCount() {
  console.log('Fetching goals with nested observations count...')
  const { data, error } = await supabase
    .from('pai_goals')
    .select(`
      id,
      title,
      observations:goal_observations(count)
    `)
    .limit(1)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Goal with count:', JSON.stringify(data[0], null, 2))
  }
}

checkNestedCount()
