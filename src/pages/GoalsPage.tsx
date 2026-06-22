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
import GoalCard from "@/components/GoalCard";
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
import { usePatient } from "@/contexts/PatientContext";

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const { currentPatient, currentPatientId, currentFamilyId } = usePatient();
  
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
    if (currentPatientId) {
      loadGoals();
    }
  }, [currentPatientId]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentPatientId || !currentFamilyId) {
        setLoading(false);
        return;
      }

      const { data: teamData } = await supabase
        .from("equipo_pai")
        .select("rol")
        .eq("user_id", user.id)
        .eq("persona_autismo_id", currentPatientId)
        .maybeSingle();

      if (teamData) {
        setUserRole(teamData.rol || "");
      }

      const { data: goalsData } = await supabase
        .from("pai_goals")
        .select(`
          *,
          observations:goal_observations(count)
        `)
        .eq("persona_autismo_id", currentPatientId)
        .order("created_at", { ascending: false });

      setGoals(goalsData || []);

      // Cargar nombres del equipo para accountability
      const { data: teamMembers } = await supabase
        .from("equipo_pai")
        .select("user_id, rol, invite_email")
        .eq("familia_id", currentFamilyId);
      
      if (teamMembers) {
        const nameMap: Record<string, string> = {};
        teamMembers.forEach(m => {
          if (m.user_id) {
            nameMap[m.user_id] = m.invite_email?.split('@')[0] || m.rol || "Miembro del Equipo";
          }
        });
        setTeamNames(nameMap);
      }
    } catch (error) {
      console.error("Error loading goals:", error);
      toast.error("Error al cargar los objetivos");
    } finally {
      setLoading(false);
    }
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
          familia_id: currentFamilyId,
          persona_autismo_id: currentPatientId,
          title: newGoal.title,
          description: newGoal.description,
          status: isParent ? "in_progress" : "pending_approval",
          progress: 0,
          propuesto_por: user?.id,
          rol_propuso: userRole,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success(isParent ? "Objetivo creado correctamente" : "Objetivo propuesto al equipo familiar");
      setShowCreateGoal(false);
      setNewGoal({ title: "", description: "" });
      await loadGoals();
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
            <p className="text-sm md:text-base text-slate-500 font-semibold tracking-tight">Metas terapéuticas para {currentPatient?.name || "el paciente"}</p>
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
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  obsCount={obsCount}
                  isExpanded={isExpanded}
                  onToggleExpand={toggleExpand}
                  evidences={evidences}
                  teamNames={teamNames}
                  userRole={userRole}
                  isSubmitting={isSubmitting}
                  onApprove={handleApproveGoal}
                  onReject={handleRejectGoal}
                  onReactivate={(g) => { setSelectedGoal(g); setShowReactivate(true); }}
                  onEdit={(g) => { setGoalToEdit(g); setShowEditGoal(true); }}
                  onDelete={(g) => { setGoalToDelete(g); setShowDeleteConfirm(true); }}
                />
              );
            })}

            {goals.length === 0 && (
              <div className="bg-white border-4 border-slate-100 border-dotted rounded-[64px] p-24 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 border-2 border-slate-100 shadow-inner">
                  <Target size={48} className="text-slate-200" />
                </div>
                <p className="font-black uppercase text-xs tracking-[0.3em] text-slate-400">Sin objetivos definidos</p>
                <p className="text-sm mt-3 font-semibold text-slate-300 max-w-xs mx-auto">Trabaja con el equipo terapéutico para definir las primeras metas del PAI de {currentPatient?.name || "el paciente"}.</p>
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
                      Para <span className="font-black text-primary uppercase">{currentPatient?.name || "el paciente"}</span>
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
