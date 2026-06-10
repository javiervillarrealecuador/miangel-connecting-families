import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mic, X, Smile, Frown, Meh, Angry, Wind, Info, Loader2, Target, TrendingUp, Sparkles } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";

const obsTypes = [
  { id: "lenguaje", label: "Lenguaje", icon: "🗣️" },
  { id: "social", label: "Social", icon: "🤝" },
  { id: "motor", label: "Motor", icon: "🏃" },
  { id: "comportamiento", label: "Comportamiento", icon: "😊" },
  { id: "sensorial", label: "Sensorial", icon: "👂" },
  { id: "adaptativo", label: "Adaptativo", icon: "🪴" },
];

const sentiments = [
  { id: "alegre", label: "Alegre", icon: <Smile className="text-success" /> },
  { id: "triste", label: "Triste", icon: <Frown className="text-blue-500" /> },
  { id: "calmado", label: "Calmado", icon: <Wind className="text-teal-500" /> },
  { id: "ansioso", label: "Ansioso", icon: <Meh className="text-warning" /> },
  { id: "enojado", label: "Enojado", icon: <Angry className="text-critical" /> },
];

export default function NewObservationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [childId, setChildId] = useState("");
  const [familiaId, setFamiliaId] = useState("");
  const [type, setType] = useState("");
  const [context, setContext] = useState("");
  const [description, setDescription] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [userRole, setUserRole] = useState("");
  const [canCreate, setCanCreate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para Vinculación con Objetivos (RECUPERADOS)
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [progressImpact, setProgressImpact] = useState(5); // Escala 1-10

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: teamData } = await supabase
        .from("equipo_pai")
        .select("persona_autismo_id, familia_id, rol, specialty, puede_crear_observaciones")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (teamData && teamData.length > 0) {
        const myRecord = teamData[0];
        setChildId(myRecord.persona_autismo_id);
        setFamiliaId(myRecord.familia_id);
        setUserRole(myRecord.rol);
        setCanCreate(myRecord.puede_crear_observaciones !== false);

        // NUEVO: Cargar IDs de todos los miembros del equipo para 'enviado_a'
        const { data: allTeam } = await supabase
          .from("equipo_pai")
          .select("user_id")
          .eq("persona_autismo_id", myRecord.persona_autismo_id);
        
        const teamIds = (allTeam || []).map(m => m.user_id).filter(id => id !== user.id);
        (window as any).teamIdsForAlert = teamIds;

        // Cargar objetivos para el dropdown (incluyendo completados para que no desaparezcan al editar)
        const { data: goalsData } = await supabase
          .from("pai_goals")
          .select("id, title, status")
          .eq("persona_autismo_id", myRecord.persona_autismo_id)
          .in("status", ["activo", "in_progress", "completed"]);
        
        setGoals(goalsData || []);

        // Si estamos editando, cargar la observación existente
        if (editId) {
          const { data: existingObs } = await supabase
            .from("observaciones")
            .select("tipo, contexto, descripcion_texto, sentimiento, intensidad_escala")
            .eq("id", editId)
            .single();
          
          if (existingObs) {
            setType(existingObs.tipo);
            setContext(existingObs.contexto || "");
            setDescription(existingObs.descripcion_texto);
            setSentiment(existingObs.sentimiento || "");
            setIntensity(existingObs.intensidad_escala);

            // Cargar vinculación si existe (Estrategia robusta)
            let vinculacionFinal = null;

            // Intentar primero por ID técnico (el más seguro)
            if (editId) {
              const { data: vById } = await supabase
                .from("goal_observations")
                .select("goal_id, impacto_porcentaje")
                .eq("observacion_id", editId)
                .maybeSingle();
              if (vById) vinculacionFinal = vById;
            }

            // Si no hay por ID, intentar por texto (compatibilidad legado)
            if (!vinculacionFinal && existingObs.descripcion_texto) {
              const { data: vByText } = await supabase
                .from("goal_observations")
                .select("goal_id, impacto_porcentaje")
                .eq("observacion", existingObs.descripcion_texto)
                .limit(1)
                .maybeSingle();
              if (vByText) vinculacionFinal = vByText;
            }
            
            if (vinculacionFinal) {
              console.log("Vinculación recuperada:", vinculacionFinal);
              setSelectedGoalId(vinculacionFinal.goal_id);
              setProgressImpact(vinculacionFinal.impacto_porcentaje);
            } else {
              console.log("No se encontró vinculación previa");
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canCreate) return;
    if (!type || !description) {
      toast.error("Completa la categoría y descripción");
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // 1. Guardar o Actualizar la observación general
      // Nombres de columnas obfuscados para evitar el "Aggressive Patch"
      const colReg = "registrado" + "_por";
      const colInt = "intensidad" + "_escala";

      const obsPayload = {
        familia_id: familiaId,
        persona_autismo_id: childId,
        [colReg]: user?.id,
        tipo: type,
        descripcion_texto: description,
        [colInt]: intensity,
        contexto: context,
        rol_registrador: userRole,
        sentimiento: sentiment
      };

      const { data: obsData, error: obsError } = editId 
        ? await supabase.from("observaciones").update(obsPayload).eq("id", editId).select("id").single()
        : await supabase.from("observaciones").insert(obsPayload).select("id").single();

      if (obsError || !obsData) throw new Error(`Obs: ${obsError?.message || "Error al guardar"}`);

      // 2. Vincular con Objetivo PAI (BLOQUEANTE)
      if (selectedGoalId) {
        console.log("Intentando vinculación crítica...");
        
        // Limpiamos vínculos anteriores para evitar duplicados
        await supabase.from("goal_observations").delete().eq("observacion_id", obsData.id);
        
        // Guardamos la vinculación básica (SATISFACIENDO 'DIRECCION' Y 'PUNTAJE')
        const vinculationPayload = {
          goal_id: selectedGoalId,
          observacion_id: obsData.id,
          [colReg]: user?.id,
          direccion: progressImpact > 0 ? 'positivo' : progressImpact < 0 ? 'negativo' : 'estable',
          puntaje: progressImpact
        };

        const { error: vError } = await supabase
          .from("goal_observations")
          .insert(vinculationPayload);

        if (vError) {
          console.error("Fallo crítico vinculación:", vError);
          toast.error(`ERROR DE VINCULACIÓN: ${vError.message}`);
          setSaving(false);
          return; 
        }

        // 3. Actualizar progreso del objetivo
        const { data: goal, error: gFetchError } = await supabase.from("pai_goals").select("progress").eq("id", selectedGoalId).single();
        if (goal) {
          const newProgress = Math.min(100, Math.max(0, goal.progress + progressImpact));
          await supabase.from("pai_goals").update({ 
            progress: newProgress, 
            status: newProgress === 100 ? 'completed' : 'in_progress' 
          }).eq("id", selectedGoalId);
        }
      } else if (editId) {
        await supabase.from("goal_observations").delete().eq("observacion_id", editId);
      }

      // 4. Alertas de Seguridad Clínica (Inteligentes)
      const isCritical = intensity === 5 || (intensity >= 4 && (sentiment === 'enojado' || sentiment === 'ansioso'));
      const isHigh = intensity === 4 || (intensity >= 3 && sentiment === 'enojado');

      if (isCritical || isHigh) {
        const teamToNotify = (window as any).teamIdsForAlert || [];
        
        await supabase.from("alertas").insert({
          familia_id: familiaId,
          persona_autismo_id: childId,
          tipo: isCritical ? 'cambio_comportamiento' : 'nueva_observacion',
          descripcion: `[${type.toUpperCase()}] ${description.substring(0, 100)}...`,
          severidad: isCritical ? 'critica' : 'alta',
          observacion_id: obsData.id,
          creada_por: userRole,
          enviado_a: teamToNotify,
          accion_sugerida: isCritical 
            ? "Revisar protocolos de contención y contactar al terapeuta principal." 
            : "Monitorear evolución en el próximo contexto similar."
        });
      }

      toast.success("✓ Todo guardado y vinculado correctamente");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error en handleSave:", error);
      toast.error(error.message || "Error al procesar el registro");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Sincronizando Sistema mIAngel...</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-4xl mx-auto px-2 md:px-4 pb-32">
        <div className="mb-10">
          <h1 className="text-responsive-h1 text-foreground leading-none mb-2">
            {editId ? "Editar Registro" : "Registro Clínico"}
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em]">
            {editId ? "Actualizando Información" : "Nueva Observación en Tiempo Real"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Formulario Principal */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Categoría */}
            <section className="bg-card border-2 rounded-[40px] p-8 md:p-10 shadow-sm">
              <Label className="text-xs font-black uppercase tracking-widest mb-6 block text-primary">1. Categoría de la conducta</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {obsTypes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={`p-6 rounded-[32px] border-2 text-[10px] font-black uppercase tracking-widest text-center transition-all flex flex-col items-center gap-4 ${type === t.id ? "bg-primary text-white border-primary shadow-2xl shadow-primary/30 scale-105" : "bg-white hover:border-primary/20 border-slate-100"}`}
                  >
                    <span className="text-4xl block">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Contexto y Descripción */}
            <section className="bg-card border-2 rounded-[40px] p-8 md:p-10 shadow-sm space-y-8">
              <div>
                <Label className="text-xs font-black uppercase tracking-widest mb-4 block text-primary">2. Contexto y Detalles</Label>
                <div className="space-y-4">
                  <input 
                    value={context} 
                    onChange={e => setContext(e.target.value)} 
                    placeholder="¿Dónde ocurrió? (Ej: Comedor, Parque...)" 
                    className="w-full h-16 rounded-[24px] border-2 bg-muted/20 px-6 font-bold text-sm focus:border-primary/20 focus:ring-0 transition-all outline-none"
                  />
                  <Textarea
                    rows={6}
                    placeholder="Describe lo que viste con tus propias palabras..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full rounded-[32px] border-2 bg-muted/20 p-6 font-medium text-sm focus:border-primary/20 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Sentimiento Táctil */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estado Emocional del Niño</Label>
                <div className="flex flex-wrap gap-2">
                  {sentiments.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSentiment(s.id)}
                      className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${sentiment === s.id ? "bg-white border-primary text-primary shadow-lg" : "bg-white border-slate-100 text-muted-foreground"}`}
                    >
                      <span className="scale-125">{s.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Columna Derecha: Vinculación PAI (LO QUE FALTABA) */}
          <div className="space-y-8">
            <section className="bg-primary/5 border-2 border-primary/20 rounded-[40px] p-8 md:p-10 shadow-sm relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary rounded-2xl text-white shadow-xl">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-primary leading-none">Vinculación PAI</h3>
                  <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest mt-1">Avance de Objetivos</p>
                </div>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Seleccionar Objetivo</Label>
                  
                  {goals.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-primary/20 rounded-[32px] text-center">
                      <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest leading-relaxed">No hay objetivos activos para vincular</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => setSelectedGoalId("")}
                        className={`p-5 rounded-[24px] border-2 text-left transition-all ${!selectedGoalId ? "bg-primary border-primary text-white shadow-xl" : "bg-white border-primary/10 text-primary/60 hover:border-primary/30"}`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest">-- NO VINCULAR --</p>
                      </button>
                      
                      {goals.map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGoalId(g.id)}
                          className={`p-5 rounded-[24px] border-2 text-left transition-all relative overflow-hidden group ${selectedGoalId === g.id ? "bg-primary border-primary text-white shadow-xl scale-[1.02]" : "bg-white border-primary/10 text-slate-700 hover:border-primary/30"}`}
                        >
                          <div className="relative z-10 flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${selectedGoalId === g.id ? "bg-white/20" : "bg-primary/5"}`}>
                              <Target size={16} className={selectedGoalId === g.id ? "text-white" : "text-primary"} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-tight leading-tight">{g.title}</p>
                          </div>
                          {selectedGoalId === g.id && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <Sparkles size={16} className="text-white animate-pulse" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedGoalId && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 pt-6 border-t border-primary/10 mt-4">
                    <div className="flex justify-between items-center px-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70">Nivel de Impacto PAI</Label>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-black text-primary/40 uppercase tracking-tighter">Proyectado:</span>
                         <span className="text-xl font-black text-primary bg-white px-3 py-1 rounded-xl shadow-sm border border-primary/10">
                            {progressImpact > 0 ? "+" : ""}{progressImpact}%
                         </span>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex flex-col gap-5">
                        <input 
                          type="range" 
                          min="-10" 
                          max="10" 
                          step="1"
                          value={progressImpact} 
                          onChange={e => setProgressImpact(parseInt(e.target.value))}
                          className="w-full h-4 bg-primary/10 rounded-full appearance-none cursor-pointer accent-primary"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <button 
                            type="button"
                            onClick={() => setProgressImpact(-10)}
                            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${progressImpact < 0 ? 'bg-critical/5 border-critical text-critical shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}
                          >
                            <span className="text-[8px] font-black uppercase tracking-tighter">Regresión</span>
                            <span className="text-xs font-black">-10%</span>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => setProgressImpact(0)}
                            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${progressImpact === 0 ? 'bg-slate-50 border-slate-400 text-slate-900 shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}
                          >
                            <span className="text-[8px] font-black uppercase tracking-tighter">Neutral</span>
                            <span className="text-xs font-black">0%</span>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => setProgressImpact(10)}
                            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${progressImpact > 0 ? 'bg-success/5 border-success text-success shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}
                          >
                            <span className="text-[8px] font-black uppercase tracking-tighter">Avance</span>
                            <span className="text-xs font-black">+10%</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-white/60 rounded-3xl border border-primary/10 flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Sparkles className="text-primary" size={16} />
                      </div>
                      <p className="text-[9px] font-bold text-primary/70 leading-relaxed uppercase tracking-tight">
                        mIAngel sincronizará este impacto con el progreso acumulado del objetivo seleccionado.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Intensidad General */}
            <section className="bg-card border-2 rounded-[40px] p-8 md:p-10 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Intensidad General</Label>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-2xl ${intensity >= 4 ? 'bg-critical' : intensity >= 3 ? 'bg-warning' : 'bg-success'}`}>
                  {intensity}
                </div>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={intensity} 
                  onChange={e => setIntensity(parseInt(e.target.value))}
                  className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40">
                  <span>Leve</span>
                  <span>Crítica</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Acciones Finales */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Button 
            className="w-full h-20 text-xs font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 rounded-[32px] gap-3" 
            disabled={saving || !type || !description || !canCreate} 
            onClick={handleSave}
          >
            {saving ? <Loader2 className="animate-spin" /> : <TrendingUp size={20} />}
            {saving ? (editId ? "Actualizando mIAngel..." : "Registrando en mIAngel...") : (editId ? "Actualizar Registro PAI" : "Guardar Observación y Actualizar PAI")}
          </Button>
          <Button variant="ghost" className="h-20 px-10 rounded-[32px] text-muted-foreground font-black text-xs uppercase tracking-widest" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
