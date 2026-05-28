import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Loader2, Filter, X, Search, Calendar, User, MapPin, 
  Music, MoreVertical, Edit2, Trash2, Smile, Frown, Meh, 
  Angry, Wind, Target, RotateCcw, Activity, MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { timeAgo } from "@/data/mockData";
import { supabase } from "@/lib/supabase";

const typeOptions = ["Lenguaje", "Social", "Motor", "Comportamiento", "Sensorial", "Adaptativo"];

const severityStyles: Record<string, string> = {
  baja: "text-success bg-success/10 border-success/20",
  normal: "text-blue-500 bg-blue-50 border-blue-100",
  alta: "text-warning bg-warning/10 border-warning/20",
  critica: "text-critical bg-critical/10 border-critical/20 font-black",
};

const typeIcons: Record<string, any> = {
  lenguaje: <MessageSquare size={16} />,
  social: <Smile size={16} />,
  motor: <Activity size={16} />,
  comportamiento: <Target size={16} />,
  sensorial: <Wind size={16} />,
  adaptativo: <RotateCcw size={16} />
};

const sentimentIcons: Record<string, any> = {
  positivo: <Smile className="text-success" size={24} strokeWidth={2.5} />,
  neutral: <Meh className="text-slate-400" size={24} strokeWidth={2.5} />,
  negativo: <Frown className="text-critical" size={24} strokeWidth={2.5} />,
  alegre: <Smile className="text-success" size={16} />,
  triste: <Frown className="text-blue-500" size={16} />,
  calmado: <Wind className="text-teal-500" size={16} />,
  ansioso: <Meh className="text-warning" size={16} />,
  enojado: <Angry className="text-critical" size={16} />,
};

export default function ObservationsPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [realObservations, setRealObservations] = useState<any[]>([]);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadObservations();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("observaciones")
        .delete()
        .eq("id", deleteId);
      
      if (error) throw error;
      
      toast.success("Observación eliminada correctamente");
      setRealObservations(prev => prev.filter(obs => obs.id !== deleteId));
    } catch (error) {
      toast.error("Error al eliminar la observación");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const loadObservations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: teamData } = await supabase
      .from("equipo_pai")
      .select("persona_autismo_id")
      .eq("user_id", user.id);
      
    if (teamData && teamData.length > 0) {
      const pIds = teamData.map(t => t.persona_autismo_id).filter(id => !!id);
      if (pIds.length === 0) {
        setLoading(false);
        return;
      }
      
      const { data: obsData, error: obsError } = await supabase
        .from("observaciones")
        .select(`
          *,
          vinculacion:goal_observations(
            id,
            puntaje,
            direccion,
            goal:pai_goals(title)
          )
        `)
        .in("persona_autismo_id", pIds)
        .order("fecha_observacion", { ascending: false });
        
      if (obsError) {
        console.error("Error fetching observations with join:", obsError);
        const { data: fallbackData } = await supabase
          .from("observaciones")
          .select("*")
          .in("persona_autismo_id", pIds)
          .order("fecha_observacion", { ascending: false });
        
        if (fallbackData) setRealObservations(fallbackData);
      } else if (obsData) {
        setRealObservations(obsData);
      }

      if (pIds && pIds.length > 0 && pIds[0]) {
        const { data: teamMembers } = await supabase
          .from("equipo_pai")
          .select("user_id, rol, invite_email")
          .eq("persona_autismo_id", pIds[0]);
      
        if (teamMembers) {
          const nameMap: Record<string, string> = {};
          teamMembers.forEach(m => {
            if (m.user_id) {
              nameMap[m.user_id] = m.invite_email?.split('@')[0] || m.rol || "Miembro";
            }
          });
          setTeamNames(nameMap);
        }
      }
    }
    setLoading(false);
  };

  const filtered = typeFilter.length > 0
    ? realObservations.filter(o => o.tipo && typeFilter.map(t => t.toLowerCase()).includes(o.tipo.toLowerCase()))
    : realObservations;

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="animate-fade-in max-w-4xl mx-auto px-2 md:px-4 pb-32">
          {/* Header Responsivo */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-responsive-h1 text-foreground leading-none mb-1">Historial Clínico</h1>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Registro de Observaciones PAI</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => navigate("/observations/new")}
                className="w-full sm:w-auto h-12 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-black text-[10px] uppercase tracking-widest gap-2"
              >
                <Plus size={18} /> Nueva Observación
              </Button>
              <Button 
                variant="outline" 
                className={`w-full sm:w-auto h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 ${typeFilter.length > 0 ? 'bg-primary/5 border-primary text-primary' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} /> {showFilters ? 'Cerrar Filtros' : 'Filtrar Historial'} {typeFilter.length > 0 && `(${typeFilter.length})`}
              </Button>
            </div>
          </div>

          {/* Panel de Filtros Responsivo */}
          {showFilters && (
            <div className="bg-card border-2 rounded-[32px] p-6 mb-8 animate-fade-in shadow-xl shadow-primary/5">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrar por Categoría</p>
                {typeFilter.length > 0 && (
                  <button className="text-[10px] font-black uppercase text-critical hover:underline" onClick={() => setTypeFilter([])}>Limpiar Todo</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${typeFilter.includes(t) ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-card border-slate-100 hover:border-slate-200"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {loading ? (
               <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Sincronizando Historial...</p>
               </div>
            ) : filtered.length === 0 ? (
               <div className="p-16 text-center border-4 border-dotted rounded-[48px] bg-card text-muted-foreground">
                  <Search size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="font-black uppercase text-xs tracking-widest">Sin resultados</p>
                  <p className="text-sm mt-2">No hay observaciones que coincidan con los filtros.</p>
               </div>
            ) : (
              filtered.map((obs) => {
                const vinculacion = obs.vinculacion?.[0];
                const linkedGoal = vinculacion?.goal;
                const impactVal = vinculacion?.puntaje;
                const impactDir = vinculacion?.direccion;
                
                const isPositive = impactDir === 'positivo';
                const isNegative = impactDir === 'negativo';
                const impactValNum = impactVal !== undefined && impactVal !== null ? Number(impactVal) : null;
                const displayImpact = impactValNum !== null ? (isNegative ? `-${Math.abs(impactValNum)}%` : `+${impactValNum}%`) : null;
                
                const authorName = obs.registrado_por ? teamNames[obs.registrado_por] : null;
                const displayAuthor = authorName ? `${authorName} (${obs.rol_registrador || "MEMBER"})` : (obs.rol_registrador || "MEMBER");

                return (
                  <div key={obs.id} className="relative bg-white border-2 border-slate-100 rounded-[40px] p-8 md:p-10 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                        <div className="flex items-center gap-5">
                          <div className="text-4xl bg-gradient-to-br from-slate-50 to-slate-100 w-16 h-16 rounded-[24px] flex items-center justify-center border-2 border-white shadow-xl group-hover:scale-110 transition-transform">
                            {typeIcons[obs.tipo?.toLowerCase()] || '📝'}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight leading-none">{obs.tipo}</h3>
                              {linkedGoal && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 border-none">
                                  <Target size={12} strokeWidth={4} />
                                  Meta: {linkedGoal.title}
                                </div>
                              )}
                              {obs.sentimiento && (
                                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                  {sentimentIcons[obs.sentimiento.toLowerCase()]}
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{obs.sentimiento}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${severityStyles[obs.severidad?.toLowerCase()] || severityStyles.normal}`}>
                                {obs.severidad?.toLowerCase() === 'critica' && <div className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse" />}
                                {obs.severidad || 'Normal'}
                              </div>
                              {displayImpact && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm cursor-help transition-all hover:scale-105 ${isPositive ? 'bg-success/10 text-success border-success/20' : isNegative ? 'bg-critical/10 text-critical border-critical/20' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                      <Activity size={12} className={isPositive ? "animate-pulse" : ""} />
                                      Impacto: {displayImpact}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[320px] p-5 bg-slate-900 text-white rounded-[28px] border-none shadow-2xl z-[100]">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-primary/20 rounded-lg">
                                          <Target size={14} className="text-primary" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Detalle de Valoración</p>
                                      </div>
                                      <p className="text-xs leading-relaxed font-medium">
                                        Impacto de <span className={isPositive ? "text-success font-bold" : "text-critical font-bold"}>{displayImpact}</span> calculado para la meta: <br/>
                                        <span className="text-primary font-bold">"{linkedGoal?.title}"</span>.
                                      </p>
                                      <div className="pt-2 border-t border-white/10">
                                        <p className="text-[9px] text-slate-400 leading-tight">
                                          Basado en una intensidad de <span className="text-white font-bold">{obs.intensidad_escala}/5</span> en el contexto de <span className="text-white font-bold">{obs.contexto || "General"}</span>.
                                        </p>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 ml-auto sm:ml-0">
                          <div className="text-right hidden sm:block">
                            <div className="flex flex-col items-end gap-1 mb-2">
                              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-white tracking-widest bg-primary px-4 py-1.5 rounded-full border shadow-lg shadow-primary/20">
                                <User size={12} strokeWidth={4} /> {displayAuthor}
                              </div>
                              <span className="text-[8px] font-black uppercase text-slate-400 mr-2 tracking-widest">REGISTRADO POR</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center justify-end gap-1.5">
                              <Calendar size={12} /> {timeAgo(new Date(obs.fecha_observacion).getTime())}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-primary">
                                <MoreVertical size={20} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-2 p-2 min-w-[160px] shadow-2xl">
                              <DropdownMenuItem 
                                onClick={() => navigate(`/observations/new?edit=${obs.id}`)}
                                className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest gap-3 cursor-pointer focus:bg-primary/5 focus:text-primary"
                              >
                                <Edit2 size={16} /> Editar Registro
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(obs.id)}
                                className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest gap-3 cursor-pointer text-critical focus:bg-critical/5 focus:text-critical"
                              >
                                <Trash2 size={16} /> Eliminar Registro
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-6 md:p-8 rounded-[32px] border-2 border-white shadow-inner mb-8 group-hover:bg-white transition-colors">
                        <p className="text-base md:text-lg font-medium text-slate-700 leading-relaxed italic">
                          "{obs.descripcion_texto}"
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 tracking-widest bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                          <MapPin size={16} className="text-primary" strokeWidth={3} />
                          {obs.contexto || "General"}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mr-1">Intensidad</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div 
                                key={i} 
                                className={`h-2.5 w-6 rounded-full transition-all duration-500 ${
                                  i <= obs.intensidad_escala 
                                    ? (obs.intensidad_escala >= 4 ? 'bg-gradient-to-r from-critical to-red-400 shadow-lg shadow-critical/20' : 'bg-gradient-to-r from-primary to-blue-400 shadow-lg shadow-primary/20') 
                                    : 'bg-slate-100'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent className="rounded-[40px] border-4 p-8">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">¿Eliminar esta observación?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 font-medium">
                  Esta acción no se puede deshacer. El registro se eliminará permanentemente de mIAngel y del historial clínico.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 mt-6">
                <AlertDialogCancel className="rounded-2xl h-12 font-black text-[10px] uppercase tracking-widest border-2">Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="rounded-2xl h-12 font-black text-[10px] uppercase tracking-widest bg-critical hover:bg-critical/90 shadow-xl shadow-critical/20"
                >
                  {deleting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Trash2 className="mr-2" size={16} />}
                  Confirmar Eliminación
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}
