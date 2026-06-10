// ActivitiesPage.tsx – Revised UI implementation
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  Sparkles,
  Target,
  ArrowRight,
  Loader2,
  X,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";

export default function ActivitiesPage() {
  // -------------------------------------------------------------------
  // State handling
  // -------------------------------------------------------------------
  const [step, setStep] = useState(0); // 0: Context, 1: Goal, 2: Results
  const NO_GOAL_OPTION = {
    id: "__sin_objetivo__",
    title: "Solo quiero controlar la situación",
    area: "Regulación",
    progress: 0,
    _sinObjetivo: true,
  } as const;
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
  const [guideOpen, setGuideOpen] = useState(false);
  const [practiceActivity, setPracticeActivity] = useState<any>(null);

  // -------------------------------------------------------------------
  // Initialization – fetch user & goals
  // -------------------------------------------------------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        supabase
          .from("equipo_pai")
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
      .select("id, title, area, progress, familia_id")
      .eq("persona_autismo_id", cid)
      .in("status", ["activo", "in_progress"]);
    setActiveGoals(data || []);
  };

  // -------------------------------------------------------------------
  // Helpers – webhook URLs (dev proxy aware)
  // -------------------------------------------------------------------
  const getWebhookUrl = (type: "test" | "production") => {
    const baseUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || "";
    if (baseUrl && !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1")) {
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      return type === "test"
        ? `${cleanBase}/webhook-test/actividades-sugerir`
        : `${cleanBase}/webhook/actividades-sugerir`;
    }
    return type === "test" ? "/n8n/webhook-test/actividades-sugerir" : "/n8n/webhook/actividades-sugerir";
  };

  // -------------------------------------------------------------------
  // UI flow helpers
  // -------------------------------------------------------------------
  const goToGoalSelection = () => {
    if (!query) {
      toast.error("Por favor, dinos dónde estás");
      return;
    }
    setStep(1);
  };

  // -------------------------------------------------------------------
  // Utility for robust parsing of activities from API or n8n
  // -------------------------------------------------------------------
  const parseActivities = (data: any): any[] => {
    let rawList: any[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data?.recomendaciones && Array.isArray(data.recomendaciones)) {
      rawList = data.recomendaciones;
    } else if (data?.actividades && Array.isArray(data.actividades)) {
      rawList = data.actividades;
    } else if (typeof data === "object" && data !== null) {
      if (data.json && Array.isArray(data.json)) {
        rawList = data.json;
      } else if (data.json?.recomendaciones && Array.isArray(data.json.recomendaciones)) {
        rawList = data.json.recomendaciones;
      } else {
        const vals = Object.values(data);
        const isMapOfObjects = vals.length > 1 && vals.every(v => typeof v === "object" && v !== null && !Array.isArray(v));
        if (isMapOfObjects) {
          rawList = vals;
        } else {
          rawList = [data];
        }
      }
    } else if (typeof data === "string") {
      try {
        const parsedStr = JSON.parse(data.replace(/```json/g, "").replace(/```/g, "").trim());
        return parseActivities(parsedStr);
      } catch {
        rawList = [];
      }
    }

    if (rawList.length > 0 && rawList[0]?.json) {
      rawList = rawList.map(r => r.json);
    }

    return rawList.map((item) => {
      let pasos: string[] = [];
      const rawPasos = item.pasos || item.instrucciones || item.instructions;
      if (Array.isArray(rawPasos) && rawPasos.length) pasos = rawPasos;
      else if (typeof rawPasos === "string" && rawPasos.trim())
        pasos = rawPasos.split(/\n|\\n|;/).map((p: string) => p.trim()).filter(Boolean);

      return {
        ...item,
        id: item.id || Math.random().toString(36).substr(2, 9),
        nombre: item.nombre || item.titulo || item.title || item.actividad || "Estrategia Sugerida",
        descripcion: item.descripcion || item.respuesta || "Sin descripción",
        pasos,
        resultado_esperado: item.resultado_esperado || "",
        isRecommended: true,
        aiReasoning: item.aiReasoning || item.razon || item.razon_personalizada || "Sugerencia basada en IA.",
      };
    });
  };

  // -------------------------------------------------------------------
  // Interaction with n8n – generate activity list
  // -------------------------------------------------------------------
  const handleSearch = async () => {
    if (!selectedGoal) {
      toast.error("Selecciona un objetivo o elige 'Controlar la situación'");
      return;
    }
    setLoading(true);
    setStep(2);
    try {
      const payload = {
        ubicacion: query,
        objetivo: selectedGoal._sinObjetivo ? "Control de situación (sin objetivo específico)" : selectedGoal.title,
        persona_autismo_id: childId,
        sin_objetivo: selectedGoal._sinObjetivo || false,
        // Legacy fields for compatibility
        contexto: query,
        objetivo_id: selectedGoal._sinObjetivo ? null : selectedGoal.id,
        objetivo_titulo: selectedGoal._sinObjetivo ? "Control de situación" : selectedGoal.title,
        child_id: childId,
        user_id: userId,
      };
      const testUrl = getWebhookUrl("test");
      let response = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);
      if (!response || response.status === 404) {
        const prodUrl = getWebhookUrl("production");
        response = await fetch(prodUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!response.ok) throw new Error(`n8n respondió con ${response.status}`);
      const data = await response.json();
      setRawN8nData(data);
      
      const parsed = parseActivities(data);
      setResults(parsed);
      toast.success("¡Estrategias generadas con IA!");
    } catch (e: any) {
      console.error(e);
      toast.error(`Error al conectar con n8n: ${e.message || e}`);
      setResults([
        {
          id: "fallback",
          nombre: "Error de Conexión",
          descripcion: "No se pudo conectar a n8n. Verifica el flujo o genera con IA.",
          pasos: [],
          isRecommended: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // IA generation (fallback or manual trigger)
  // -------------------------------------------------------------------
  const handleGenerateWithAI = async () => {
    if (!selectedGoal) {
      toast.error("Selecciona un objetivo primero");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-activities", {
        body: {
          query,
          goalTitle: selectedGoal.title,
          esSinObjetivo: !!selectedGoal._sinObjetivo,
        },
      });
      if (error) throw error;
      const formatted = parseActivities(data);
      setResults(formatted);
      toast.success("Actividades generadas con Gemini");
    } catch (e: any) {
      console.error(e);
      toast.error(`Error IA: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // Feedback persistence
  // -------------------------------------------------------------------
  const handleSaveFeedback = async (activityId: string) => {
    if (!userId) return;
    const activity = results.find((r) => r.id === activityId);
    if (!activity) {
      toast.error("Actividad no encontrada");
      return;
    }
    const { error: fbErr } = await supabase
      .from("retroalimentacion_actividades")
      .insert({
        actividad_sugerida_id: activityId,
        evaluado_por: userId,
        funcionamiento_efectivo: rating[0] >= 3,
        escala_efectividad: rating[0],
        comentarios: `Completado via App – ${rating[0]}/5`,
      });
    if (fbErr) {
      toast.error(`Error feedback: ${fbErr.message}`);
      return;
    }
    // Map area to observation type
    const areaMap = (area: string) => {
      const low = area?.toLowerCase() || "";
      if (low.includes("lenguaje") || low.includes("comunicación")) return "lenguaje";
      if (low.includes("social")) return "social";
      if (low.includes("motor")) return "motor";
      if (low.includes("sensorial")) return "sensorial";
      if (low.includes("comportamiento") || low.includes("conducta")) return "comportamiento";
      if (low.includes("adaptativo")) return "adaptativo";
      return "social";
    };
    const obsPayload = {
      familia_id: familiaId || selectedGoal?.familia_id,
      persona_autismo_id: childId,
      registrado_por: userId,
      tipo: areaMap(selectedGoal?.area || activity.area || "social"),
      descripcion_texto: `[LOGRO] Actividad "${activity.nombre}" completada.\n${activity.descripcion}\nEfectividad: ${rating[0]}/5`,
      intensidad_escala: rating[0],
      contexto: query || "Actividades",
      rol_registrador: userRole || "Padre",
      sentimiento: rating[0] >= 4 ? "alegre" : rating[0] >= 3 ? "calmado" : "ansioso",
    };
    const { data: obsData, error: obsErr } = await supabase.from("observaciones").insert(obsPayload).select("id").single();
    if (obsErr) {
      toast.warning("Retroalimentación guardada, pero fallo crear observación");
    } else if (selectedGoal) {
      const impact = rating[0] >= 4 ? 10 : rating[0] >= 3 ? 5 : 0;
      if (impact > 0) {
        const { data: goal } = await supabase.from("pai_goals").select("progress").eq("id", selectedGoal.id).single();
        if (goal) {
          const newProg = Math.min(100, Math.max(0, goal.progress + impact));
          await supabase
            .from("pai_goals")
            .update({ progress: newProg, status: newProg === 100 ? "completed" : "in_progress" })
            .eq("id", selectedGoal.id);
        }
        // link observation -> goal
        await supabase.from("goal_observations").insert({
          goal_id: selectedGoal.id,
          observacion_id: obsData.id,
          registrado_por: userId,
          direccion: impact > 0 ? "positivo" : "estable",
          puntaje: impact,
        });
      }
    }
    toast.success("¡Logro guardado!");
    setFeedbackId(null);
    setGuideOpen(false);
    setPracticeActivity(null);
    setResults((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, veces_completada: (a.veces_completada || 0) + 1 } : a))
    );
  };

  // -------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl pb-10">
        {/* Header */}
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
              {step === 2 &&
                (selectedGoal?._sinObjetivo
                  ? `Control de situación en ${query}`
                  : `Analizando ${query} para ${selectedGoal?.title}`)}
            </p>
          </div>
        </div>

        {/* Paso 0 – Contexto */}
        {step === 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-card border-2 rounded-3xl p-8 text-center shadow-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary rotate-3">
                <MapPin size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Describe la circunstancia y el lugar en dónde está sucediendo, para recomendarte actividades profesionales.</h2>
              <p className="text-muted-foreground mb-8">mIAngel revisará el perfil de tu hijo(a), su historial y busca exclusivamente en libros autorizados y validados científicamente y te dará 3 sugerencias para que las puedas trabajar. Elije una.</p>
              <div className="relative max-w-md mx-auto">
                <Input
                  className="h-16 text-lg pl-14 rounded-2xl border-2 focus:border-primary transition-all shadow-lg"
                  placeholder="Describe que sucede y donde"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goToGoalSelection()}
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
              </div>
              <Button className="mt-8 h-14 w-full max-w-md btn-touch rounded-2xl bg-primary text-lg font-bold shadow-xl shadow-primary/20" onClick={goToGoalSelection}>
                Continuar <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 1 – Selección de objetivo */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid gap-3">
              {activeGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal)}
                  className={`flex items-start gap-4 p-5 rounded-3xl border-2 transition-all text-left ${
                    selectedGoal?.id === goal.id ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-muted bg-card hover:border-primary/40"
                  }`}
                >
                  <div className={`mt-1 p-2 rounded-xl ${selectedGoal?.id === goal.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    <Target size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{goal.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">
                        {goal.area}
                      </Badge>
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
              {/* Sin objetivo */}
              <button
                onClick={() => setSelectedGoal(selectedGoal?.id === NO_GOAL_OPTION.id ? null : NO_GOAL_OPTION)}
                className={`flex items-start gap-4 p-5 rounded-3xl border-2 transition-all text-left mt-2 ${
                  selectedGoal?.id === NO_GOAL_OPTION.id
                    ? "border-orange-400 bg-orange-50 ring-4 ring-orange-100 dark:bg-orange-950/20 dark:border-orange-500"
                    : "border-dashed border-muted bg-card hover:border-orange-300"
                }`}
              >
                <div
                  className={`mt-1 p-2 rounded-xl ${
                    selectedGoal?.id === NO_GOAL_OPTION.id ? "bg-orange-400 text-white" : "bg-orange-100 text-orange-500 dark:bg-orange-950"
                  }`}
                >
                  <span className="text-lg">🛟</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">Sin objetivo específico</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Solo quiero controlar y calmar la situación en este momento
                  </p>
                  <Badge variant="outline" className="mt-1.5 text-[10px] uppercase font-black tracking-tighter border-orange-300 text-orange-500">
                    Regulación situacional
                  </Badge>
                </div>
                {selectedGoal?.id === NO_GOAL_OPTION.id && (
                  <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </button>
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
                <>
                  Obtener Estrategia <Sparkles className="ml-2" size={22} />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Pantalla de Carga de IA */}
        {step === 2 && loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-primary/20 rounded-full animate-ping absolute top-0 left-0"></div>
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center relative z-10 border-4 border-white dark:border-background shadow-lg">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-black text-foreground mb-4 tracking-tight">Procesando información...</h3>
            <div className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed border-2 border-primary/15 bg-primary/5 p-6 rounded-3xl shadow-sm relative">
              <Sparkles className="absolute -top-3 -right-3 text-primary/40" size={24} />
              Las actividades recomendadas están fundamentadas en metodologías con evidencia clínica comprobada (ABA, ESDM, TEACCH y otras). Procesamos tu información para garantizar que cada sugerencia sea específica y aplicable a tu caso.
              <div className="mt-4 pt-4 border-t border-primary/10 font-bold text-foreground/80">
                Esto toma unos momentos. Gracias por esperar.
              </div>
            </div>
          </div>
        )}

        {/* Paso 2 – Resultados compactas */}
        {step === 2 && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Banner resumen */}
            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                <Sparkles size={22} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-0.5">Estrategias generadas</p>
                <p className="text-sm text-foreground/80 leading-snug">
                  <strong>{results.length} actividad{results.length !== 1 && "es"}</strong> para <strong>{query}</strong>
                  {selectedGoal && !selectedGoal._sinObjetivo && <> — {selectedGoal.title}</>}
                  {selectedGoal?._sinObjetivo && <> — Control de situación</>}
                </p>
              </div>
              {results.length > 0 && (
                <Badge className="bg-primary/10 text-primary border-none text-xs font-black shrink-0">{results.length} opciones</Badge>
              )}
            </div>

            {/* Lista de opciones completas */}
            <div className="space-y-6 mt-4">
              {!practiceActivity &&
                results.map((act, idx) => (
                  <div key={act.id} className="bg-card border-2 border-muted rounded-[1.75rem] overflow-hidden shadow-sm">
                    <div className="p-5 pb-4">
                      {/* Cabecera compacta */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/50">Opción {idx + 1}</span>
                            <Badge className="h-4 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-tighter border-none">
                              {act.area || "General"}
                            </Badge>
                          </div>
                          <h3 className="font-black text-foreground leading-tight">{act.nombre}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-[10px] font-bold text-muted-foreground shrink-0">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />{act.duracion_estimada_minutos || 15}m
                          </span>
                          <span className="flex items-center gap-1">
                            <Star size={11} className="text-yellow-500" />{act.efectividad_promedio || "4.5"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/75 leading-relaxed mb-4">{act.descripcion}</p>
                      {/* Pasos */}
                      {act.pasos && act.pasos.length > 0 && (
                        <div className="space-y-3 mb-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-primary/60 mb-1">📋 Pasos</p>
                          {act.pasos.map((p: string, i: number) => (
                            <div key={i} className="flex gap-3 items-start py-1">
                              <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center mt-0.5 shadow-sm">
                                {i + 1}
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed">{p}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Resultado esperado */}
                      {act.resultado_esperado && (
                        <div className="border-l-2 border-emerald-500 pl-3 mb-4 flex gap-2">
                          <span className="text-emerald-600 shrink-0 text-sm">🎯</span>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mb-0.5">Resultado esperado</p>
                            <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">{act.resultado_esperado}</p>
                          </div>
                        </div>
                      )}

                      {/* Razonamiento */}
                      {act.aiReasoning && (
                        <div className="border-l-2 border-primary/30 pl-3 mb-4 italic text-xs text-slate-500 flex gap-2">
                          <span className="text-primary font-black shrink-0">mIAngel:</span>
                          <span>"{act.aiReasoning}"</span>
                        </div>
                      )}
                    </div>
                    <div className="px-5 pb-5">
                      <Button
                        className="w-full h-12 rounded-2xl font-black text-sm bg-primary shadow-md shadow-primary/20"
                        onClick={() => {
                          setPracticeActivity(act);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Practicar esta actividad <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                ))
              }

              {/* Detalle de la actividad elegida */}
              {practiceActivity && (
                <div className="space-y-5 bg-card border-2 border-primary/20 rounded-[1.75rem] p-5 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <button
                      onClick={() => {
                        setPracticeActivity(null);
                        setFeedbackId(null);
                      }}
                      className="text-xs font-bold text-primary px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-2"
                    >
                      <ArrowRight size={14} className="rotate-180" /> Volver a las opciones
                    </button>
                  </div>
                  <div className="text-center py-2">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl mx-auto mb-3">🧩</div>
                    <Badge className="bg-primary/10 text-primary border-none font-black text-xs mb-2">
                      {practiceActivity.area || "General"}
                    </Badge>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">{practiceActivity.nombre}</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{practiceActivity.descripcion}</p>
                  </div>
                  {/* Pasos */}
                  {practiceActivity.pasos && practiceActivity.pasos.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-primary/70 mb-2">📋 Pasos a seguir</p>
                      {practiceActivity.pasos.map((p: string, i: number) => (
                        <div key={i} className="flex gap-3 items-start py-1.5">
                          <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-black flex items-center justify-center mt-0.5 shadow-sm">
                            {i + 1}
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed">{p}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Resultado esperado */}
                  {practiceActivity.resultado_esperado && (
                    <div className="border-l-2 border-emerald-500 pl-3 flex gap-3">
                      <span className="text-emerald-600 text-sm shrink-0">🎯</span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-0.5">Resultado esperado</p>
                        <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">{practiceActivity.resultado_esperado}</p>
                      </div>
                    </div>
                  )}
                  {/* Razonamiento */}
                  {practiceActivity.aiReasoning && (
                    <div className="border-l-2 border-primary/30 pl-3 italic text-sm text-slate-500 flex gap-3">
                      <span className="text-primary font-black shrink-0">mIAngel:</span>
                      <span>"{practiceActivity.aiReasoning}"</span>
                    </div>
                  )}
                  {/* Duración & efectividad */}
                  <div className="flex gap-6 justify-center mt-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                      <Clock size={16} className="text-primary/60" />{practiceActivity.duracion_estimada_minutos || 15} min
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                      <Star size={16} className="text-yellow-500" />Efectividad: {practiceActivity.efectividad_promedio || "4.5"}/5
                    </div>
                  </div>
                  {/* Acción final */}
                  {feedbackId === practiceActivity.id ? (
                    <div className="bg-muted/30 p-5 rounded-2xl space-y-4 border-2 border-dashed border-primary/20 mt-6">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-black uppercase tracking-widest">¿Cómo resultó?</p>
                        <span className="text-2xl font-black text-primary">{rating[0]}/5</span>
                      </div>
                      <Slider value={rating} onValueChange={setRating} min={1} max={5} step={1} className="py-2" />
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 h-12 bg-success text-success-foreground hover:bg-success/90 rounded-xl font-bold"
                          onClick={async () => {
                            await handleSaveFeedback(practiceActivity.id);
                          }}
                        >
                          Guardar Logro
                        </Button>
                        <Button variant="ghost" onClick={() => setFeedbackId(null)} className="h-12 rounded-xl">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-16 rounded-3xl bg-primary text-xl font-black shadow-2xl shadow-primary/30 mt-6"
                      onClick={() => setFeedbackId(practiceActivity.id)}
                    >
                      🎉 ¡Lo Logramos!
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Debug panel */}
            <div className="mt-6 p-4 bg-muted/30 border-2 border-dashed border-muted rounded-[2rem]">
              <details className="cursor-pointer group">
                <summary className="font-bold text-sm text-muted-foreground select-none flex items-center gap-2 hover:text-primary transition-colors">
                  🔍 Depuración de Conexión n8n
                </summary>
                <div className="space-y-4 mt-4 text-left">
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
        )}
      </div>
    </AppLayout>
  );
}
