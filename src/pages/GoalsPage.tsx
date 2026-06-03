import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  MessageSquare, 
  TrendingUp,
  RotateCcw,
  History,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Pencil,
  Trash2,
  MoreVertical,
  AlertTriangle,
  User
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState("");
  const [childId, setChildId] = useState("");
  const [userRole, setUserRole] = useState("");
  
  // Estados para detalles, reactivación y creación
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [goalEvidences, setGoalEvidences] = useState<Record<string, any[]>>({});
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [showReactivate, setShowReactivate] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [goalToEdit, setGoalToEdit] = useState<any>(null);
  const [goalToDelete, setGoalToDelete] = useState<any>(null);
  const [reactivateNote, setReactivateNote] = useState("");
  const [newGoal, setNewGoal] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: teamData } = await supabase
      .from("equipo_pai")
      .select("persona_autismo_id, familia_id, rol, personas_autismo(full_name)")
      .eq("user_id", user.id)
      .limit(1);

    if (teamData && teamData.length > 0) {
      const pid = teamData[0].persona_autismo_id;
      setChildId(pid);
      setUserRole(teamData[0].rol);
      // @ts-ignore
      setChildName(teamData[0].personas_autismo?.full_name || "tu hijo/a");

      const { data: goalsData } = await supabase
        .from("pai_goals")
        .select(`
          *,
          observations:goal_observations(count)
        `)
        .eq("persona_autismo_id", pid)
        .order("created_at", { ascending: false });

      setGoals(goalsData || []);

      // Cargar nombres del equipo para accountability
      if (teamData[0].familia_id) {
        const { data: teamMembers } = await supabase
          .from("equipo_pai")
          .select("user_id, rol, invite_email")
          .eq("familia_id", teamData[0].familia_id);
        
        if (teamMembers) {
          const nameMap: Record<string, string> = {};
          teamMembers.forEach(m => {
            if (m.user_id) {
              nameMap[m.user_id] = m.invite_email?.split('@')[0] || m.rol || "Miembro del Equipo";
            }
          });
          setTeamNames(nameMap);
        }
      }
    }
    setLoading(false);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.description.trim()) {
      toast.error("Por favor completa el título y la descripción");
      return;
    }

    setIsSubmitting(true);
    try {
      const isParent = userRole?.toLowerCase() === 'madre' || userRole?.toLowerCase() === 'padre';
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("pai_goals")
        .insert({
          persona_autismo_id: childId,
          title: newGoal.title,
          description: newGoal.description,
          status: isParent ? "in_progress" : "pending_approval",
          progress: 0,
          propuesto_por: user?.id
        });

      if (error) throw error;

      toast.success(isParent ? "Objetivo creado correctamente" : "Objetivo propuesto al equipo familiar");
      setShowCreateGoal(false);
      setNewGoal({ title: "", description: "" });
      loadGoals();
    } catch (error: any) {
      toast.error("Error al crear el objetivo");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!goalToEdit.title.trim() || !goalToEdit.description.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("pai_goals")
        .update({
          title: goalToEdit.title,
          description: goalToEdit.description
        })
        .eq("id", goalToEdit.id);

      if (error) throw error;

      toast.success("Objetivo actualizado correctamente");
      setShowEditGoal(false);
      loadGoals();
    } catch (error: any) {
      toast.error("Error al actualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;

    setIsSubmitting(true);
    try {
      // Primero eliminamos las observaciones vinculadas (si la DB no tiene ON DELETE CASCADE)
      await supabase.from("goal_observations").delete().eq("goal_id", goalToDelete.id);
      
      const { error } = await supabase
        .from("pai_goals")
        .delete()
        .eq("id", goalToDelete.id);

      if (error) throw error;

      toast.success("Objetivo eliminado permanentemente");
      setShowDeleteConfirm(false);
      loadGoals();
    } catch (error: any) {
      toast.error("No se pudo eliminar el objetivo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadEvidences = async (goalId: string, force = false) => {
    if (!force && goalEvidences[goalId] && goalEvidences[goalId].length > 0) return;

    try {
      const { data, error } = await supabase
        .from("goal_observations")
        .select(`
          *,
          observation_data:observaciones(descripcion_texto, sentimiento, tipo, contexto, registrado_por)
        `)
        .eq("goal_id", goalId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setGoalEvidences(prev => ({ ...prev, [goalId]: data || [] }));
    } catch (err) {
      console.error("Error loading evidences:", err);
      toast.error("No se pudieron cargar las evidencias");
    }
  };

  const toggleExpand = (goalId: string) => {
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null);
    } else {
      setExpandedGoalId(goalId);
      loadEvidences(goalId, true); // Forzamos carga fresca al expandir
    }
  };

  const handleReactivate = async () => {
    if (!reactivateNote.trim()) {
      toast.error("Por favor ingresa una nota de justificación");
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const { error: goalError } = await supabase
        .from("pai_goals")
        .update({ status: "in_progress", progress: 90 })
        .eq("id", selectedGoal.id);

      if (goalError) throw goalError;

      const { error: obsError } = await supabase
        .from("goal_observations")
        .insert({
          goal_id: selectedGoal.id,
          registrado_por: user?.id,
          observacion: `[REACTIVACIÓN] ${reactivateNote}`,
          impacto_porcentaje: -10,
          rol_registrador: userRole
        });

      if (obsError) throw obsError;

      toast.success("Objetivo reactivado correctamente");
      setShowReactivate(false);
      setReactivateNote("");
      loadGoals();
    } catch (error: any) {
      toast.error("Error al reactivar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveGoal = async (goalId: string) => {
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    try {
      const { error } = await supabase
        .from("pai_goals")
        .update({ 
          status: "in_progress", 
          aprobado_por: user?.id,
          fecha_aprobacion: new Date().toISOString()
        })
        .eq("id", goalId);

      if (error) throw error;
      toast.success("Objetivo aprobado e integrado al PAI");
      loadGoals();
    } catch (err) {
      toast.error("Error al aprobar el objetivo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectGoal = async (goalId: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("pai_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;
      toast.success("Objetivo rechazado y eliminado");
      loadGoals();
    } catch (err) {
      toast.error("Error al rechazar el objetivo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-5xl mx-auto px-2 md:px-4">
        {/* Header Responsivo */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-responsive-h1 text-slate-900 leading-none">Plan de Acción (PAI)</h1>
            <p className="text-sm md:text-base text-slate-500 font-semibold tracking-tight">Metas terapéuticas para {childName}</p>
          </div>
          <Button 
            onClick={() => setShowCreateGoal(true)}
            className="w-full sm:w-auto h-14 px-8 rounded-[24px] bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-[0.2em] gap-2 transition-all active:scale-95"
          >
            <Plus size={18} /> Proponer Objetivo
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-muted-foreground gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="font-black text-[10px] uppercase tracking-[0.3em] text-primary/60">Sincronizando Metas del PAI...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 pb-20">
            {goals.map((goal) => {
              const obsCount = goal.observations?.[0]?.count || 0;
              const isExpanded = expandedGoalId === goal.id;
              const evidences = goalEvidences[goal.id] || [];

              return (
                <div key={goal.id} className={`bg-white border-2 rounded-[48px] p-6 md:p-12 shadow-sm transition-all overflow-hidden ${goal.status === 'completed' ? 'border-success/20 bg-success/5' : 'border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-slate-200/50'}`}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-5">
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${
                          goal.status === 'completed' ? "bg-success text-white shadow-lg shadow-success/20" : 
                          goal.status === 'pending_approval' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" :
                          "bg-primary text-white shadow-lg shadow-primary/20"
                        }`}>
                          {goal.status === 'completed' ? '✓ Completado' : 
                           goal.status === 'pending_approval' ? '⏳ Pendiente de Aprobación' :
                           '⚡ En Proceso'}
                        </span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                          <Calendar size={14} className="text-slate-300" /> {new Date(goal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-4 uppercase">{goal.title}</h3>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-10 h-10 rounded-full p-0 hover:bg-slate-100 transition-colors">
                              <MoreVertical size={20} className="text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 bg-white border-2 border-slate-100 shadow-2xl">
                            <DropdownMenuItem 
                              onClick={() => { setGoalToEdit(goal); setShowEditGoal(true); }}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-primary/5 text-slate-700 hover:text-primary transition-colors"
                            >
                              <Pencil size={16} />
                              <span className="text-[11px] font-black uppercase tracking-widest">Editar Meta</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => { setGoalToDelete(goal); setShowDeleteConfirm(true); }}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-critical/5 text-critical transition-colors"
                            >
                              <Trash2 size={16} />
                              <span className="text-[11px] font-black uppercase tracking-widest">Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">{goal.description}</p>
                    </div>
                    
                    {goal.status === 'pending_approval' && (userRole?.toLowerCase() === 'madre' || userRole?.toLowerCase() === 'padre') && (
                      <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <Button 
                          className="flex-1 md:flex-none h-14 px-6 rounded-2xl bg-success hover:bg-success/90 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-success/20 gap-2"
                          onClick={() => handleApproveGoal(goal.id)}
                          disabled={isSubmitting}
                        >
                          <CheckCircle2 size={18} /> Aprobar
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 md:flex-none h-14 px-6 rounded-2xl border-2 border-critical/20 text-critical hover:bg-critical/5 font-black text-[10px] uppercase tracking-widest gap-2"
                          onClick={() => handleRejectGoal(goal.id)}
                          disabled={isSubmitting}
                        >
                          <Trash2 size={18} /> Rechazar
                        </Button>
                      </div>
                    )}

                    {goal.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        className="w-full md:w-auto border-2 border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest h-14 px-8 rounded-2xl bg-white hover:bg-primary/5 shadow-sm transition-all"
                        onClick={() => { setSelectedGoal(goal); setShowReactivate(true); }}
                      >
                        <RotateCcw size={16} className="mr-2" /> Reactivar Meta
                      </Button>
                    )}
                  </div>

                  {goal.status === 'pending_approval' && (
                    <div className="bg-amber-50 border-2 border-amber-100 p-6 md:p-8 rounded-[32px] mb-8 flex flex-col md:flex-row items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
                        <AlertTriangle size={32} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <p className="font-black text-amber-900 text-sm uppercase tracking-tight mb-1">Meta propuesta por el especialista</p>
                        <p className="text-xs text-amber-700 font-medium">Esta meta fue sugerida por {teamNames[goal.propuesto_por] || "un terapeuta"}. Los padres deben aprobarla para que se active el seguimiento del progreso.</p>
                      </div>
                    </div>
                  )}

                  {/* Barra de Progreso Premium */}
                  <div className="space-y-6 bg-[#f8fafc] p-8 md:p-10 rounded-[40px] border-2 border-slate-50 shadow-inner mb-8">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
                          <TrendingUp size={16} className="text-primary" /> Progreso de la Meta
                        </span>
                        <p className="text-xs font-bold text-slate-300">Basado en evidencias clínicas</p>
                      </div>
                      <span className="font-black text-primary text-4xl tracking-tighter">{goal.progress}%</span>
                    </div>
                    <div className="relative h-5 md:h-6 bg-slate-200 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                      <div 
                        className="absolute inset-y-0 left-0 bg-primary shadow-lg shadow-primary/20 transition-all duration-1000 ease-out rounded-full"
                        style={{ width: `${goal.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-8 pt-2">
                      <div className="flex items-center gap-3 text-[11px] font-black uppercase text-slate-500 tracking-tight">
                        <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/10">
                          <MessageSquare size={18} />
                        </div>
                        {obsCount} Evidencias Vinculadas
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-black uppercase text-slate-500 tracking-tight">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                          <History size={18} />
                        </div>
                        Último avance: {new Date(goal.updated_at || goal.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Sección de Evidencias Rediseñada como Timeline Profesional */}
                  <div className="border-t border-slate-50 pt-8">
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleExpand(goal.id)}
                      className="w-full flex justify-between items-center group h-14 rounded-3xl hover:bg-slate-50 px-6 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? "bg-primary text-white" : "bg-primary/5 text-primary"}`}>
                          <History size={20} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
                          {isExpanded ? "Ocultar Historial Clínico" : `Ver ${obsCount} Evidencias Clínicas`}
                        </span>
                      </div>
                      <ArrowRight size={20} className={`text-primary/30 group-hover:text-primary transition-all duration-300 ${isExpanded ? "rotate-90" : ""}`} />
                    </Button>

                    {isExpanded && (
                      <div className="mt-12 space-y-0 relative pl-8 md:pl-12">
                        {/* Línea del Timeline */}
                        <div className="absolute left-[15px] md:left-[19px] top-4 bottom-4 w-1 bg-gradient-to-b from-primary/20 via-slate-100 to-transparent rounded-full" />
                        
                        {evidences.length > 0 ? (
                          <div className="space-y-10">
                                {evidences.map((obs, idx) => {
                                  // Detección robusta de impacto (soporta múltiples esquemas y tipos de datos)
                                  const rawImpact = obs.puntaje ?? obs.impacto_porcentaje ?? obs.impact_percentage ?? obs.impacto ?? 0;
                                  const impactVal = typeof rawImpact === 'string' ? parseInt(rawImpact) : Number(rawImpact);
                                  
                                  // Identidad del autor
                                  const authorId = obs.registrado_por || obs.observation_data?.registrado_por;
                                  const authorName = authorId ? teamNames[authorId] : null;
                                  const displayAuthor = authorName ? `${authorName} (${obs.rol_registrador || "Especialista"})` : (obs.rol_registrador || "Especialista");

                                  const isReactivation = obs?.observacion?.includes("[REACTIVACIÓN]");
                                  
                                  // Manejo defensivo: Supabase puede devolver objeto o array según la relación detectada
                                  const rawObsData = obs.observation_data;
                                  const detail = Array.isArray(rawObsData) ? rawObsData[0] : rawObsData;
                                  
                                  return (
                                    <div key={obs.id || idx} className="relative group/item">
                                      {/* Punto del Timeline */}
                                      <div className={`absolute -left-[23px] md:-left-[27px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 transition-transform group-hover/item:scale-125 ${impactVal > 0 ? "bg-success" : impactVal < 0 ? "bg-critical" : "bg-slate-300"}`} />
                                      
                                      <div className="bg-white border-2 border-slate-50 p-6 md:p-8 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/10 transition-all">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                          <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-black/10">
                                              <Calendar size={12} />
                                              {obs.created_at ? new Date(obs.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha pendiente'}
                                            </div>
                                            <div className="flex items-center gap-2 bg-primary/5 text-primary border border-primary/10 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                              <User size={12} strokeWidth={3} />
                                              {displayAuthor}
                                            </div>
                                            {isReactivation && (
                                              <div className="bg-amber-500 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/20">
                                                <RotateCcw size={12} /> Ajuste de PAI
                                              </div>
                                            )}
                                          </div>
                                          
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-[10px] uppercase tracking-tighter cursor-help transition-all hover:scale-105 ${
                                                impactVal > 0 ? "bg-success/5 border-success/20 text-success" : 
                                                impactVal < 0 ? "bg-critical/5 border-critical/20 text-critical" : 
                                                "bg-slate-50 border-slate-100 text-slate-400"
                                              }`}>
                                                {impactVal > 0 ? <ArrowUpRight size={14} /> : impactVal < 0 ? <ArrowDownRight size={14} /> : <Activity size={14} />}
                                                Impacto {impactVal}%
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[320px] p-5 bg-slate-900 text-white rounded-[28px] border-none shadow-2xl z-[100]">
                                              <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                  <div className="p-1.5 bg-primary/20 rounded-lg">
                                                    <TrendingUp size={14} className="text-primary" />
                                                  </div>
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Análisis de Impacto PAI</p>
                                                </div>
                                                <p className="text-xs leading-relaxed font-medium">
                                                  Esta observación de <span className="text-primary font-bold">{obs.tipo}</span> (Intensidad: {obs.intensidad_escala}/5) genera un impacto neto de <span className={impactVal >= 0 ? "text-success font-bold" : "text-critical font-bold"}>{impactVal}%</span> sobre el progreso de esta meta específica.
                                                </p>
                                                <div className="pt-2 border-t border-white/10">
                                                  <p className="text-[9px] text-slate-400 italic">Valor determinado por el especialista basándose en la relevancia clínica del evento.</p>
                                                </div>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
    
                                        <div className="relative">
                                          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/10 rounded-full" />
                                          <div className="space-y-2 pl-4">
                                            <p className="text-base md:text-lg font-bold text-slate-800 leading-relaxed">
                                              {obs.observacion || detail?.descripcion_texto || "Sin descripción detallada."}
                                            </p>
                                            {detail?.contexto && (
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Contexto: {detail.contexto}
                                              </p>
                                            )}
                                          </div>
                                        </div>
    
                                        {(obs.sentimiento || detail?.sentimiento) && (
                                          <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 w-fit px-4 py-2 rounded-xl border border-slate-100">
                                            Estado Emocional: <span className="text-slate-900">{obs.sentimiento || detail?.sentimiento}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                          </div>
                        ) : (
                          <div className="py-20 text-center bg-slate-50/50 rounded-[48px] border-4 border-slate-50 border-dotted mr-4">
                            <Activity size={48} className="mx-auto mb-6 text-slate-200" />
                            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Historial clínico vacío</h4>
                            <p className="text-xs mt-3 text-slate-300 font-medium max-w-xs mx-auto">Las evidencias de avances aparecerán aquí conforme el equipo registre nuevas observaciones diarias.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {goals.length === 0 && (
              <div className="bg-white border-4 border-slate-100 border-dotted rounded-[64px] p-24 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 border-2 border-slate-100 shadow-inner">
                  <Target size={48} className="text-slate-200" />
                </div>
                <p className="font-black uppercase text-xs tracking-[0.3em] text-slate-400">Sin objetivos definidos</p>
                <p className="text-sm mt-3 font-semibold text-slate-300 max-w-xs mx-auto">Trabaja con el equipo terapéutico para definir las primeras metas del PAI de {childName}.</p>
                <Button 
                  onClick={() => setShowCreateGoal(true)}
                  className="mt-10 bg-primary h-14 px-10 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20"
                >
                  Proponer primer objetivo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Modal para Crear Nuevo Objetivo */}
        <Dialog open={showCreateGoal} onOpenChange={setShowCreateGoal}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 max-h-[95dvh] overflow-y-auto border-none shadow-2xl rounded-[32px] bg-white">
            <div className="bg-primary/5 p-6 md:p-8 border-b border-primary/10 shrink-0">
              <DialogHeader>
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-xl border-2 border-primary/5 shrink-0">
                    <Target size={28} />
                  </div>
                  <div>
                    <DialogTitle className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter">
                      Nuevo Objetivo PAI
                    </DialogTitle>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Para <span className="font-black text-primary uppercase">{childName}</span>
                    </p>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Título de la Meta</Label>
                <input
                  id="title"
                  placeholder="Ej: Saludar al entrar a un lugar"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full h-14 rounded-[20px] border-2 border-slate-100 focus:border-primary/30 focus:ring-0 outline-none px-5 text-sm font-bold placeholder:text-slate-300 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Descripción y Criterios</Label>
                <Textarea
                  id="description"
                  placeholder="Describe cómo se medirá este avance..."
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="min-h-[100px] md:min-h-[120px] rounded-[24px] border-2 border-slate-100 focus:border-primary/30 focus:ring-0 outline-none p-5 text-sm font-medium placeholder:text-slate-300 transition-all resize-none"
                />
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-slate-50 flex flex-row gap-3">
              <Button 
                variant="ghost" 
                className="h-14 flex-1 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 px-0" 
                onClick={() => setShowCreateGoal(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="h-14 flex-[2] rounded-[20px] bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20 gap-2 transition-all active:scale-95 px-0" 
                onClick={handleCreateGoal}
                disabled={isSubmitting || !newGoal.title.trim() || !newGoal.description.trim()}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Crear Objetivo</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Reactivación Responsivo */}
        <Dialog open={showReactivate} onOpenChange={setShowReactivate}>
          <DialogContent className="max-w-[95vw] sm:max-w-md p-0 max-h-[95dvh] overflow-y-auto border-none shadow-2xl rounded-[32px] bg-white">
            <div className="bg-primary/5 p-6 md:p-8 border-b border-primary/10 shrink-0">
              <DialogHeader>
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-primary shadow-xl border-2 border-primary/10 shrink-0">
                    <RotateCcw size={28} />
                  </div>
                  <div>
                    <DialogTitle className="text-xl md:text-2xl font-black text-primary uppercase tracking-tighter">
                      Reactivar Meta PAI
                    </DialogTitle>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      <span className="font-black text-slate-900 italic line-clamp-1">"{selectedGoal?.title}"</span>
                    </p>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="note" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nota de Justificación Clínica</Label>
                <Textarea
                  id="note"
                  placeholder="Describe la regresión observada..."
                  value={reactivateNote}
                  onChange={(e) => setReactivateNote(e.target.value)}
                  className="min-h-[100px] rounded-3xl border-2 border-slate-100 focus:border-primary/20 outline-none p-5 text-sm font-medium resize-none"
                />
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-100 flex gap-3">
                <div className="text-amber-800 pt-0.5"><RotateCcw size={14} /></div>
                <p className="text-[10px] text-amber-800 leading-relaxed font-black uppercase tracking-tight">
                  Al reactivar, el progreso bajará al 90% para permitir nuevos registros.
                </p>
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-slate-50 flex flex-row gap-3">
              <Button variant="ghost" className="h-14 flex-1 rounded-[20px] font-black text-[11px] uppercase tracking-widest px-0" onClick={() => setShowReactivate(false)}>
                Cancelar
              </Button>
              <Button 
                className="h-14 flex-[2] rounded-[20px] bg-primary font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20 gap-2 px-0" 
                onClick={handleReactivate}
                disabled={isSubmitting || !reactivateNote.trim()}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para Editar Objetivo */}
        <Dialog open={showEditGoal} onOpenChange={setShowEditGoal}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 max-h-[95dvh] overflow-y-auto border-none shadow-2xl rounded-[32px] bg-white text-slate-900">
            <div className="bg-blue-500/5 p-6 md:p-8 border-b border-blue-500/10 shrink-0">
              <DialogHeader>
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center text-blue-500 shadow-xl border-2 border-blue-500/5 shrink-0">
                    <Pencil size={28} />
                  </div>
                  <DialogTitle className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter">
                    Editar Meta
                  </DialogTitle>
                </div>
              </DialogHeader>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Título de la Meta</Label>
                <input
                  id="edit-title"
                  value={goalToEdit?.title || ''}
                  onChange={(e) => setGoalToEdit({ ...goalToEdit, title: e.target.value })}
                  className="w-full h-14 rounded-[20px] border-2 border-slate-100 focus:border-blue-500/30 focus:ring-0 outline-none px-5 text-sm font-bold transition-all text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Descripción y Criterios</Label>
                <Textarea
                  id="edit-desc"
                  value={goalToEdit?.description || ''}
                  onChange={(e) => setGoalToEdit({ ...goalToEdit, description: e.target.value })}
                  className="min-h-[100px] rounded-[24px] border-2 border-slate-100 focus:border-blue-500/30 focus:ring-0 outline-none p-5 text-sm font-medium transition-all resize-none text-slate-700"
                />
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-slate-50 flex flex-row gap-3">
              <Button variant="ghost" className="h-14 flex-1 rounded-[20px] font-black text-[11px] uppercase tracking-widest px-0" onClick={() => setShowEditGoal(false)}>Cancelar</Button>
              <Button 
                className="h-14 flex-[2] rounded-[20px] bg-blue-500 hover:bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 gap-2 transition-all active:scale-95 px-0"
                onClick={handleUpdateGoal}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Guardar</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alerta de Confirmación para Eliminar */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-sm rounded-[32px] p-0 max-h-[95dvh] overflow-y-auto border-none shadow-2xl bg-white text-slate-900">
            <div className="p-8 pb-6 text-center shrink-0">
              <div className="w-16 h-16 bg-critical/10 rounded-[24px] flex items-center justify-center text-critical mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">¿Eliminar Meta?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-500 font-medium leading-relaxed">
                  Se eliminará <span className="font-bold text-slate-900">"{goalToDelete?.title}"</span> y sus evidencias. Esto no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="p-6 bg-slate-50 flex flex-row gap-3">
              <AlertDialogCancel className="h-12 flex-1 m-0 rounded-[20px] border-2 border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteGoal}
                className="h-12 flex-1 m-0 rounded-[20px] bg-critical hover:bg-critical/90 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-critical/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Sí, Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
