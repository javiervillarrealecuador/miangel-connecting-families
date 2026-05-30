import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPostgresTypes() {
  console.log("Querying information_schema.columns for table 'actividades'...");
  const { data, error } = await supabase
    .from('actividades')
    .select('id')
    .limit(1);

  if (error) {
    console.error("Connection error:", error);
    return;
  }

  // Use a postgres function or raw SQL if possible, but since we are using service role key,
  // we can call a RPC if one exists, or query using the Postgrest REST interface on postgres schema if allowed.
  // Wait, let's run a query through supabase.rpc if we have a custom SQL query function, but we might not have one.
  // Let's fetch the Postgrest API documentation directly, which lists all types of the table.
  // Postgrest serves a JSON description of the database under the root route. Let's fetch it using a simple fetch request.
  
  try {
    const url = `${supabaseUrl}/rest/v1/`;
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const schema = await response.json();
    const tableDef = schema.definitions.actividades;
    if (tableDef && tableDef.properties) {
      console.log("Column definitions from Postgrest schema:");
      for (const colName of Object.keys(tableDef.properties)) {
        const prop = tableDef.properties[colName];
        let typeStr = prop.type;
        if (prop.type === 'array') {
          typeStr = `array of ${prop.items ? prop.items.type : 'unknown'}`;
        }
        console.log(`- ${colName}: ${typeStr} (format: ${prop.format || 'none'})`);
      }
    } else {
      console.log("Could not find table 'actividades' in schema definitions.");
    }
  } catch (err) {
    console.error("Error fetching schema definitions:", err);
  }
}

checkPostgresTypes();
