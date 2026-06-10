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
    const apiKey = Deno.env.get('DEEPSEEK_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'DEEPSEEK_API_KEY is not set on the server.' }),
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
IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin formato markdown, sin comillas triples y sin texto adicional.

El formato del JSON debe ser exactamente este:
{
  "resumen_texto": "Escribe un resumen clínico consolidado de las observaciones (máximo 3 párrafos). Debe ser empático, detallado y profesional.",
  "tendencia": "Estable o Progreso o Regresión",
  "cambios_comportamiento": "Cambios clave observados en su conducta.",
  "recomendaciones_futuro": "Sugerencias prácticas para trabajar en el aula o en el hogar."
}`

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Eres un sistema experto que siempre responde en formato JSON estricto." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`DeepSeek API responded with status ${response.status}: ${errText}`)
    }

    const apiData = await response.json()
    const responseText = apiData.choices[0].message.content
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
