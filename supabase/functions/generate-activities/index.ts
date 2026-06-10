import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_AI_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_AI_KEY is not set on the server.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { query, goalTitle, esSinObjetivo } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing query/context' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const prompt = `Eres un terapeuta ocupacional y psicólogo clínico experto en autismo (TEA) para la aplicación mIAngel.
Contexto/Lugar: "${query}"
${esSinObjetivo ? "Modo: CONTROL DE SITUACIÓN. No hay objetivo PAI específico." : `Objetivo PAI: "${goalTitle}"`}
Genera una lista de EXACTAMENTE 3 actividades con campo "pasos" como array de pasos claros.
Devuelve un objeto JSON estructurado con el formato:
{
  "recomendaciones": [
    {
      "nombre": "Nombre de la actividad",
      "descripcion": "Descripción detallada",
      "pasos": ["Paso 1", "Paso 2", "Paso 3"],
      "resultado_esperado": "Lo que se espera lograr",
      "aiReasoning": "Razonamiento clínico de por qué esta actividad ayuda",
      "area": "Área de desarrollo (ej. Motor, Sensorial, Social, Lenguaje, Comportamiento, Adaptativo)",
      "duracion_estimada_minutos": 15,
      "efectividad_promedio": "4.8"
    }
  ]
}
IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON válido. No incluyas markdown (ej. \`\`\`json), comentarios ni texto adicional.`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Google Gemini API responded with status ${response.status}: ${errText}`)
    }

    const apiData = await response.json()
    const responseText = apiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleanJsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim()
    const parsedData = JSON.parse(cleanJsonText)

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
