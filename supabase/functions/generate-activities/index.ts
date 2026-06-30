import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

    const body = await req.json()
    const {
      child_id,
      persona_autismo_id,
      objetivo_id,
      objetivo_titulo,
      contexto,
      query,
      goalTitle,
      esSinObjetivo,
      user_id
    } = body

    const patientId = child_id || persona_autismo_id
    const goalId = objetivo_id
    const goalTitleStr = objetivo_titulo || goalTitle || "Control de situación"
    const contextQuery = contexto || query || ""

    // Inicializar cliente Supabase con privilegios admin para poder consultar y guardar
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.")
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 1. Consulta perfil paciente para obtener el familia_id
    let familiaId = null
    if (patientId) {
      const { data: patientData, error: patientErr } = await supabase
        .from("personas_autismo")
        .select("familia_id")
        .eq("id", patientId)
        .maybeSingle()

      if (patientErr) {
        console.error("Error fetching patient profile:", patientErr)
      } else if (patientData) {
        familiaId = patientData.familia_id
      }
    }

    // 2. Consulta objetivos activos del paciente
    let activeGoalsList = ""
    if (patientId) {
      const { data: activeGoals, error: goalsErr } = await supabase
        .from("pai_goals")
        .select("title")
        .eq("persona_autismo_id", patientId)
        .in("status", ["activo", "in_progress"])

      if (goalsErr) {
        console.error("Error fetching active goals:", goalsErr)
      } else if (activeGoals && activeGoals.length > 0) {
        activeGoalsList = activeGoals.map((g: any) => g.title).join(", ")
      }
    }
    if (!activeGoalsList) {
      activeGoalsList = "Ninguno registrado por el momento."
    }

    // 3. Prompt general conservando íntegramente las instrucciones terapéuticas del skill original
    const prompt = `Eres un especialista en autismo. Recomienda 3 actividades terapeuticas para un nino con estos objetivos PAI. Responde en JSON con formato: {"recomendaciones": [{"nombre", "descripcion", "razon", "pasos", "duracion_estimada_minutos"}]}. El objetivo principal a trabajar es: '${goalTitleStr}'. Todos los objetivos activos del nino son: ${activeGoalsList}. Contexto actual donde se halla el niño: '${contextQuery}'. Proporciona pasos claros de implementación y duración aproximada.`

    const systemPrompt = "Eres un psicólogo clínico y terapeuta ocupacional experto en autismo (TEA). Siempre respondes exclusivamente en formato JSON estructurado válido, sin comentarios, sin formato markdown y sin comillas triples (ej. ```json)."

    // 4. Llamada a la API de DeepSeek
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
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

    const rawRecomendaciones = parsedData.recomendaciones || parsedData.actividades || []
    let finalResults = []

    // 5. Inserción directa en la base de datos de Supabase si tenemos los metadatos necesarios
    if (patientId && familiaId && rawRecomendaciones.length > 0) {
      const rowsToInsert = rawRecomendaciones.map((rec: any) => {
        let instruccionesText = ""
        if (Array.isArray(rec.pasos)) {
          instruccionesText = rec.pasos.join('\n')
        } else if (typeof rec.pasos === 'string') {
          instruccionesText = rec.pasos
        } else if (Array.isArray(rec.instrucciones)) {
          instruccionesText = rec.instrucciones.join('\n')
        } else if (typeof rec.instrucciones === 'string') {
          instruccionesText = rec.instrucciones
        }

        return {
          familia_id: familiaId,
          persona_autismo_id: patientId,
          pai_goal_id: goalId || null,
          nombre: rec.nombre || rec.titulo || "Actividad Sugerida",
          descripcion: rec.descripcion || "Sin descripción",
          instrucciones: instruccionesText,
          duracion_estimada_minutos: Number(rec.duracion_estimada_minutos) || 15,
          origen: 'generada_ia',
          activa: true,
          efectividad_promedio: 4.5,
          creada_por: user_id || null,
          sugerida_por: user_id || null
        }
      })

      const { data: insertedRows, error: insertError } = await supabase
        .from("actividades_sugeridas")
        .insert(rowsToInsert)
        .select()

      if (insertError) {
        console.error("Error inserting activities in DB:", insertError)
        // Fallback: Retornar los datos parseados aunque falle la inserción para no bloquear al usuario
        finalResults = rawRecomendaciones.map((rec: any, idx: number) => ({
          id: `fallback-${idx}-${Math.random().toString(36).substr(2, 9)}`,
          nombre: rec.nombre || rec.titulo,
          descripcion: rec.descripcion,
          pasos: Array.isArray(rec.pasos) ? rec.pasos : (rec.pasos ? [rec.pasos] : []),
          resultado_esperado: rec.resultado_esperado || "",
          aiReasoning: rec.razon || rec.aiReasoning || "Sugerencia basada en IA.",
          duracion_estimada_minutos: Number(rec.duracion_estimada_minutos) || 15,
          efectividad_promedio: 4.5
        }))
      } else if (insertedRows) {
        finalResults = insertedRows.map((row: any, idx: number) => {
          const orig = rawRecomendaciones[idx]
          return {
            ...row,
            pasos: row.instrucciones ? row.instrucciones.split('\n') : [],
            aiReasoning: orig?.razon || orig?.aiReasoning || "Sugerencia basada en IA.",
            resultado_esperado: orig?.resultado_esperado || ""
          }
        })
      }
    } else {
      // Formato legacy o falta de metadatos del paciente (caso de prueba directo sin guardar en BD)
      finalResults = rawRecomendaciones.map((rec: any, idx: number) => ({
        id: `legacy-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        nombre: rec.nombre || rec.titulo,
        descripcion: rec.descripcion,
        pasos: Array.isArray(rec.pasos) ? rec.pasos : (rec.pasos ? [rec.pasos] : []),
        resultado_esperado: rec.resultado_esperado || "",
        aiReasoning: rec.razon || rec.aiReasoning || "Sugerencia basada en IA.",
        duracion_estimada_minutos: Number(rec.duracion_estimada_minutos) || 15,
        efectividad_promedio: 4.5
      }))
    }

    return new Response(
      JSON.stringify({ recomendaciones: finalResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
