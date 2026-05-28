import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Search, MapPin, Clock, Star, CheckCircle2, Sparkles, Target, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

const contextSuggestions = ["parque", "piscina", "cocina", "casa", "escuela", "consultorio", "playa", "patio", "supermercado", "carro"];

export default function ActivitiesPage() {
  const [step, setStep] = useState(0); // 0: Context, 1: Goal Selection, 2: Results
  const [query, setQuery] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [activeGoals, setActiveGoals] = useState<any[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [rating, setRating] = useState([3]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [childId, setChildId] = useState("");
  const [userId, setUserId] = useState("");
  const [rawN8nData, setRawN8nData] = useState<any>(null);
  const [userRole, setUserRole] = useState("");
  const [familiaId, setFamiliaId] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        supabase.from("equipo_pai")
          .select("persona_autismo_id, familia_id, rol")
          .eq("user_id", user.id)
          .limit(1)
          .then(({ data }) => {
            if (data?.[0]) {
              setChildId(data[0].persona_autismo_id);
              setFamiliaId(data[0].familia_id || "");
              setUserRole(data[0].rol || "");
              fetchActiveGoals(data[0].persona_autismo_id);
            }
          });
      }
    });
  }, []);

  const fetchActiveGoals = async (cid: string) => {
    const { data } = await supabase
      .from("pai_goals")
      .select("*")
      .eq("persona_autismo_id", cid)
      .in("status", ["activo", "in_progress"]);
    setActiveGoals(data || []);
  };

  const filtered = contextSuggestions.filter(s => s.includes(query.toLowerCase()) && query.length > 0);

  const goToGoalSelection = () => {
    if (!query) {
      toast.error("Por favor, dinos dónde estás");
      return;
    }
    setStep(1);
  };

  const getWebhookUrl = (type: "test" | "production") => {
    const baseUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || "";
    // Evitamos CORS en desarrollo local ruteando a través del proxy '/n8n' de Vite
    // si la URL es local (localhost, 127.0.0.1) o está vacía.
    if (baseUrl && !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1")) {
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      return type === "test" 
        ? `${cleanBase}/webhook-test/actividades-sugerir` 
        : `${cleanBase}/webhook/actividades-sugerir`;
    }
    return type === "test" 
      ? "/n8n/webhook-test/actividades-sugerir" 
      : "/n8n/webhook/actividades-sugerir";
  };

  const handleSearch = async () => {
    if (!selectedGoal) {
      toast.error("Por favor, selecciona un objetivo para trabajar");
      return;
    }
    setLoading(true);
    setStep(2);

    try {
      let response = null;

      // En desarrollo local, intentamos primero con el Webhook de pruebas (test)
      // para que puedas ver la ejecución en tiempo real en el editor de n8n.
      const testUrl = getWebhookUrl("test");
      try {
        response = await fetch(testUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Estructura esperada por n8n según el reporte técnico
            ubicacion: query,
            objetivo: selectedGoal.title,
            persona_autismo_id: childId,
            
            // Estructura de compatibilidad (legado)
            contexto: query,
            objetivo_id: selectedGoal.id,
            objetivo_titulo: selectedGoal.title,
            child_id: childId,
            user_id: userId
          })
        });
      } catch (e) {
        console.warn("Falló el webhook de pruebas, intentando con el de producción...", e);
      }

      // Si no hay respuesta o retornó 404 (porque no estás escuchando en el editor),
      // intentamos con el Webhook de producción.
      if (!response || response.status === 404) {
        const prodUrl = getWebhookUrl("production");
        response = await fetch(prodUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Estructura esperada por n8n según el reporte técnico
            ubicacion: query,
            objetivo: selectedGoal.title,
            persona_autismo_id: childId,
            
            // Estructura de compatibilidad (legado)
            contexto: query,
            objetivo_id: selectedGoal.id,
            objetivo_titulo: selectedGoal.title,
            child_id: childId,
            user_id: userId
          })
        });
      }

      if (!response.ok) {
        throw new Error(`n8n respondió con estado: ${response.status}`);
      }

      const data = await response.json();
      console.log("Datos recibidos de n8n:", data);
      setRawN8nData(data);
      
      // Parsear la respuesta de forma dinámica
      // Soporta: 
      // 1. Array directo de actividades: [{nombre, descripcion...}]
      // 2. Formato wrapper con objeto recomendaciones: { recomendaciones: [{nombre, descripcion...}] }
      // 3. Fila única de base de datos directa (objeto plano)
      let rawList = [];
      if (data) {
        if (Array.isArray(data)) {
          rawList = data;
        } else if (data.recomendaciones && Array.isArray(data.recomendaciones)) {
          rawList = data.recomendaciones;
        } else if (typeof data === "object") {
          // Si es un objeto vacío o con un mensaje de estado, verificar si hay contenido real
          if (Object.keys(data).length > 0 && !data.message) {
            rawList = [data];
          }
        }
      }

      if (rawList.length === 0) {
        toast.warning("n8n respondió pero no se recibieron datos válidos de actividades. Verifica que los nodos anteriores (Gemini, Supabase) no estén fallando.");
      }
      
      setResults(rawList.map(r => {
        // Si viene un array de pasos, lo formateamos como texto ordenado para la descripción
        let desc = r.descripcion || r.respuesta || "No hay descripción disponible";
        if (Array.isArray(r.pasos) && r.pasos.length > 0) {
          desc += `\n\n📋 Pasos a seguir:\n` + r.pasos.map((p: string, idx: number) => `  ${idx + 1}. ${p}`).join("\n");
        }
        if (r.resultado_esperado) {
          desc += `\n\n🎯 Resultado esperado:\n  ${r.resultado_esperado}`;
        }

        return {
          ...r,
          id: r.id || Math.random().toString(),
          nombre: r.nombre || "Estrategia Sugerida",
          descripcion: desc,
          isRecommended: true,
          aiReasoning: r.aiReasoning || r.razon || r.razon_personalizada || "Sugerencia personalizada basada en tu historial."
        };
      }));

      toast.success("¡Estrategias generadas con éxito por la IA!");
    } catch (error: any) {
      toast.error(`Error en la conexión con n8n: ${error.message || error}`);
      console.error(error);
      // Fallback a simulación si falla para no romper la experiencia
      setResults([{
        id: "error-fallback",
        nombre: "Error de Conexión",
        descripcion: "No pudimos conectar con n8n. Asegúrate de que el flujo de trabajo en n8n esté activo o que hayas hecho clic en 'Listen for test event' en tu editor local.",
        isRecommended: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!selectedGoal) {
      toast.error("Por favor, selecciona un objetivo primero");
      return;
    }
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_AI_KEY;
      if (!apiKey) {
        throw new Error("No se encontró la clave de API VITE_GOOGLE_AI_KEY en las variables de entorno.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Eres un terapeuta ocupacional y psicólogo clínico experto en autismo (TEA) para la aplicación mIAngel.
Tu tarea es sugerir actividades terapéuticas personalizadas de alta calidad y validadas clínicamente para realizar en casa o el entorno especificado.

Objetivo PAI: "${selectedGoal.title}" (Área: ${selectedGoal.area || 'General'})
Contexto/Lugar actual: "${query}"

Genera una lista de exactamente 2 o 3 actividades personalizadas específicas para este objetivo en este contexto.
Devuelve los datos estrictamente como un arreglo JSON en el siguiente formato, sin formato markdown (NO uses bloques de código con triple comilla \`\`\`json), sin comentarios, sin texto explicativo alrededor, solo el JSON:
[
  {
    "nombre": "Nombre sugerente y lúdico de la actividad",
    "descripcion": "Descripción detallada paso a paso de la actividad para el padre o terapeuta.",
    "aiReasoning": "Por qué funciona esta actividad y cómo ayuda a cumplir el objetivo de '${selectedGoal.title}' en este contexto específico.",
    "area": "${selectedGoal.area || 'Social'}",
    "duracion_estimada_minutos": 15,
    "efectividad_promedio": "4.8"
  }
]`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Intentar limpiar la respuesta en caso de que venga con bloques de código markdown
      const cleanJsonText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsedData = JSON.parse(cleanJsonText);
      
      let rawList = [];
      if (Array.isArray(parsedData)) {
        rawList = parsedData;
      } else if (parsedData.recomendaciones && Array.isArray(parsedData.recomendaciones)) {
        rawList = parsedData.recomendaciones;
      } else if (typeof parsedData === "object" && parsedData !== null) {
        rawList = [parsedData];
      }

      if (rawList.length === 0) {
        throw new Error("La IA no generó recomendaciones válidas.");
      }

      setResults(rawList.map(r => ({
        ...r,
        id: r.id || Math.random().toString(),
        nombre: r.nombre || "Estrategia Sugerida",
        descripcion: r.descripcion || "No hay descripción disponible",
        isRecommended: true,
        aiReasoning: r.aiReasoning || "Sugerencia personalizada basada en tu historial."
      })));

      toast.success("¡Estrategias personalizadas generadas con éxito por Claude/Gemini!");
    } catch (error: any) {
      toast.error(`Error al generar con IA: ${error.message || error}`);
      console.error("Error en generación local:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeedback = async (activityId: string) => {
    if (!userId) return;

    const activity = results.find(r => r.id === activityId);
    if (!activity) {
      toast.error("No se encontró la actividad seleccionada.");
      return;
    }
    
    // 1. Guardar la retroalimentación en la tabla correspondiente
    const { error: feedbackError } = await supabase
      .from("retroalimentacion_actividades")
      .insert({
        actividad_sugerida_id: activityId,
        evaluado_por: userId,
        funcionamiento_efectivo: rating[0] >= 3,
        escala_efectividad: rating[0],
        comentarios: `Completado desde la App (Valoración: ${rating[0]}/5)`
      });

    if (feedbackError) {
      toast.error(`Error al guardar retroalimentación: ${feedbackError.message || feedbackError}`);
      console.error("Error al guardar retroalimentación:", feedbackError);
      return;
    }

    // 2. Mapear el área del objetivo a un tipo de observación válido
    const areaToType = (areaName: string): string => {
      const areaLower = areaName ? areaName.toLowerCase() : "";
      if (areaLower.includes("lenguaje") || areaLower.includes("comunicación")) return "lenguaje";
      if (areaLower.includes("social")) return "social";
      if (areaLower.includes("motor")) return "motor";
      if (areaLower.includes("sensorial")) return "sensorial";
      if (areaLower.includes("comportamiento") || areaLower.includes("conducta")) return "comportamiento";
      if (areaLower.includes("adaptativo")) return "adaptativo";
      return "social"; // Fallback
    };

    // 3. Registrar el logro como una observación clínica
    const obsPayload = {
      familia_id: familiaId || selectedGoal?.familia_id,
      persona_autismo_id: childId,
      registrado_por: userId,
      tipo: areaToType(selectedGoal?.area || activity.area || "social"),
      descripcion_texto: `[LOGRO] Completó la actividad sugerida: "${activity.nombre}".\nDetalle: ${activity.descripcion}\nValoración de efectividad: ${rating[0]}/5.`,
      intensidad_escala: rating[0],
      contexto: query || activity.contexto || "Actividades",
      rol_registrador: userRole || "Padre",
      sentimiento: rating[0] >= 4 ? "alegre" : rating[0] >= 3 ? "calmado" : "ansioso"
    };

    const { data: obsData, error: obsError } = await supabase
      .from("observaciones")
      .insert(obsPayload)
      .select()
      .single();

    if (obsError) {
      console.error("Error al registrar observación de actividad:", obsError);
      toast.warning("Retroalimentación guardada, pero no se pudo crear el registro en Observaciones.");
    } else if (obsData && selectedGoal) {
      // 4. Vincular con el objetivo PAI en goal_observations
      const progressImpact = rating[0] >= 4 ? 10 : rating[0] >= 3 ? 5 : 0;
      
      const { error: vError } = await supabase
        .from("goal_observations")
        .insert({
          goal_id: selectedGoal.id,
          observacion_id: obsData.id,
          registrado_por: userId,
          direccion: progressImpact > 0 ? "positivo" : "estable",
          puntaje: progressImpact
        });

      if (vError) {
        console.error("Error al vincular con objetivo PAI:", vError);
      }

      // 5. Actualizar el progreso del objetivo en la tabla pai_goals
      if (progressImpact > 0) {
        const { data: goalData } = await supabase
          .from("pai_goals")
          .select("progress")
          .eq("id", selectedGoal.id)
          .single();

        if (goalData) {
          const newProgress = Math.min(100, Math.max(0, goalData.progress + progressImpact));
          await supabase
            .from("pai_goals")
            .update({
              progress: newProgress,
              status: newProgress === 100 ? "completed" : "in_progress"
            })
            .eq("id", selectedGoal.id);
        }
      }
    }

    toast.success("¡Excelente trabajo! Logro y observación guardados con éxito.");
    setFeedbackId(null);
    setResults(prev => prev.map(a => a.id === activityId ? { ...a, veces_completada: (a.veces_completada || 0) + 1 } : a));
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl pb-10">
        
        {/* HEADER DINÁMICO */}
        <div className="flex items-center gap-3 mb-8">
          {step > 0 && (
            <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)} className="rounded-full">
              <ArrowRight className="rotate-180" size={20} />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              {step === 0 && "Actividades"}
              {step === 1 && "Selecciona Objetivo"}
              {step === 2 && "Estrategias IA"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {step === 0 && "Busca estrategias por lugar o contexto"}
              {step === 1 && "¿En qué meta quieres enfocarte hoy?"}
              {step === 2 && `Analizando ${query} para ${selectedGoal?.title}`}
            </p>
          </div>
        </div>

        {/* PASO 0: CONTEXTO */}
        {step === 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-card border-2 rounded-3xl p-8 text-center shadow-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary rotate-3">
                <MapPin size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">¿Dónde estás con tu hijo?</h2>
              <p className="text-muted-foreground mb-8">mIAngel adaptará las sugerencias a tu entorno actual.</p>
              
              <div className="relative max-w-md mx-auto">
                <Input
                  className="h-16 text-lg pl-14 rounded-2xl border-2 focus:border-primary transition-all shadow-lg"
                  placeholder="Ej: parque, cocina, centro comercial..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSugg(true); }}
                  onFocus={() => setShowSugg(true)}
                  onKeyDown={e => e.key === "Enter" && goToGoalSelection()}
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
                
                {showSugg && filtered.length > 0 && (
                  <div className="absolute z-20 w-full bg-card border-2 rounded-2xl shadow-2xl mt-2 max-h-60 overflow-y-auto p-2 animate-in fade-in zoom-in-95">
                    {filtered.map(s => (
                      <button 
                        key={s} 
                        className="w-full text-left px-4 py-4 text-base hover:bg-primary/5 rounded-xl capitalize flex items-center gap-3 transition-colors font-medium" 
                        onClick={() => { setQuery(s); setShowSugg(false); }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <MapPin size={16} />
                        </div>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                className="mt-8 h-14 w-full max-w-md btn-touch rounded-2xl bg-primary text-lg font-bold shadow-xl shadow-primary/20"
                onClick={goToGoalSelection}
              >
                Continuar <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        )}

        {/* PASO 1: SELECCIÓN DE OBJETIVO */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid gap-3">
              {activeGoals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal)}
                  className={`flex items-start gap-4 p-5 rounded-3xl border-2 transition-all text-left ${
                    selectedGoal?.id === goal.id 
                    ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                    : 'border-muted bg-card hover:border-primary/40'
                  }`}
                >
                  <div className={`mt-1 p-2 rounded-xl ${selectedGoal?.id === goal.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Target size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{goal.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">{goal.area}</Badge>
                      <span className="text-xs text-muted-foreground">Progreso: {goal.progress}%</span>
                    </div>
                  </div>
                  {selectedGoal?.id === goal.id && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </button>
              ))}

              {activeGoals.length === 0 && (
                <div className="text-center py-12 bg-muted/20 rounded-3xl border-2 border-dashed">
                  <p className="text-muted-foreground">No tienes objetivos vigentes en el PAI.</p>
                  <Button variant="link" className="font-bold">Crear primer objetivo</Button>
                </div>
              )}
            </div>

            <Button 
              className="mt-6 h-16 w-full btn-touch rounded-3xl bg-primary text-xl font-black shadow-xl shadow-primary/20"
              onClick={handleSearch}
              disabled={!selectedGoal || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" /> Analizando con IA...
                </>
              ) : (
                <>Obtener Estrategia <Sparkles className="ml-2" size={22} /></>
              )}
            </Button>
          </div>
        )}

        {/* PASO 2: RESULTADOS */}
        {step === 2 && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">Análisis Inteligente</p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Basado en el historial de <strong>{query}</strong> y el objetivo de <strong>{selectedGoal?.title}</strong>, hemos seleccionado estas estrategias validadas:
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {results.map(act => (
                <div key={act.id} className={`bg-card border-2 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all ${act.isRecommended ? 'border-primary/20 bg-primary/[0.02]' : 'border-transparent'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${act.isRecommended ? 'bg-primary/10' : 'bg-muted'}`}>
                        {act.nombre.includes("Pintura") ? "🎨" : act.nombre.includes("Juego") ? "🎮" : act.nombre.includes("Pictograma") ? "🖼️" : "🧩"}
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-foreground leading-tight tracking-tight">{act.nombre}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="h-5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-tighter border-none">
                            {act.area || "General"}
                          </Badge>
                          {act.isRecommended && (
                            <span className="flex items-center gap-1 text-[10px] text-success font-black uppercase tracking-tighter">
                              <Sparkles size={12} /> IA Recomendada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/80 mb-6 leading-relaxed">{act.descripcion}</p>
                  
                  {act.aiReasoning && (
                    <div className="bg-white/50 border border-primary/10 rounded-2xl p-4 mb-6 italic text-xs text-muted-foreground flex gap-2">
                      <span className="text-primary font-bold">mIAngel:</span> "{act.aiReasoning}"
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Clock size={16} className="text-primary/60" />
                      <span>{act.duracion_estimada_minutos || 15} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Star size={16} className="text-warning/80" />
                      <span>Efectividad: {act.efectividad_promedio || "4.5"}/5</span>
                    </div>
                  </div>

                  {feedbackId === act.id ? (
                    <div className="bg-muted/30 p-5 rounded-2xl space-y-4 animate-in zoom-in-95 border-2 border-dashed border-primary/20">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-black uppercase tracking-widest">¿Cómo resultó?</p>
                        <span className="text-2xl font-black text-primary">{rating[0]}/5</span>
                      </div>
                      <Slider value={rating} onValueChange={setRating} min={1} max={5} step={1} className="py-2" />
                      <div className="flex gap-2">
                        <Button className="flex-1 h-12 bg-success text-success-foreground hover:bg-success/90 rounded-xl font-bold" onClick={() => handleSaveFeedback(act.id)}>
                          Guardar Logro
                        </Button>
                        <Button variant="ghost" onClick={() => setFeedbackId(null)} className="h-12 rounded-xl">Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 rounded-2xl h-12 text-sm font-bold border-2" onClick={() => act.documentos_validados?.url_archivo && window.open(act.documentos_validados.url_archivo)}>
                        Ver Guía
                      </Button>
                      <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-12 text-sm font-black shadow-lg shadow-primary/20" onClick={() => setFeedbackId(act.id)}>
                        ¡Lo Logramos!
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {results.length === 0 && (
                <div className="text-center py-16 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
                  <p className="text-6xl mb-6 opacity-20">🔎</p>
                  <p className="text-lg font-bold text-muted-foreground">No encontramos una coincidencia exacta</p>
                  <p className="text-sm text-muted-foreground mb-8">Pero puedo generar una estrategia personalizada ahora mismo.</p>
                  <Button className="bg-primary px-8 h-12 rounded-xl font-bold" onClick={handleGenerateWithAI}>Generar con Claude 3.5</Button>
                </div>
              )}

              {/* PANEL DE DEPURACIÓN (Debug) */}
              <div className="mt-8 p-6 bg-muted/30 border-2 border-dashed border-muted rounded-[2rem] animate-fade-in">
                <details className="cursor-pointer group">
                  <summary className="font-bold text-sm text-muted-foreground select-none flex items-center gap-2 hover:text-primary transition-colors">
                    🔍 Depuración de Conexión n8n
                  </summary>
                  <div className="space-y-4 mt-6 text-left animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-2">Respuesta cruda recibida de n8n:</p>
                      <pre className="p-4 bg-card border-2 text-xs rounded-2xl overflow-x-auto max-h-60 shadow-inner font-mono text-foreground">
                        {JSON.stringify(rawN8nData, null, 2) || "No se ha recibido respuesta aún (o error)."}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-2">Datos formateados en el Frontend:</p>
                      <pre className="p-4 bg-card border-2 text-xs rounded-2xl overflow-x-auto max-h-60 shadow-inner font-mono text-foreground">
                        {JSON.stringify(results, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
