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

    const { formattedObs } = await req.json()

    if (!formattedObs) {
      return new Response(
        JSON.stringify({ error: 'Missing formattedObs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const prompt = `Eres un psicólogo clínico experto en autismo (TEA) para la plataforma mIAngel.
Analiza las siguientes observaciones recientes del niño/a:
${formattedObs}

Genera un análisis clínico estructurado para el Plan de Acción Integral (PAI) que ayude a los terapeutas y padres.
IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin formato markdown, sin comillas triples (ej. \`\`\`json) y sin texto adicional.

El formato del JSON debe ser exactamente este:
{
  "resumen_texto": "Escribe un resumen clínico consolidado de las observaciones (máximo 3 párrafos). Debe ser empático, detallado y profesional.",
  "tendencia": "Estable o Progreso o Regresión",
  "cambios_comportamiento": "Cambios clave observados en su conducta.",
  "recomendaciones_futuro": "Sugerencias prácticas para trabajar en el aula o en el hogar."
}`

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
