import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Filter, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import ObservationCard from "@/components/ObservationCard";
import { usePatient } from "@/contexts/PatientContext";

const typeOptions = ["Lenguaje", "Social", "Motor", "Comportamiento", "Sensorial", "Adaptativo"];

export default function ObservationsPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [realObservations, setRealObservations] = useState<any[]>([]);
  const [teamMembersMap, setTeamMembersMap] = useState<Record<string, { name: string, role: string }>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { currentPatientId } = usePatient();

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    if (currentPatientId) {
      loadObservations(0, false, typeFilter);
    }
  }, [typeFilter, currentPatientId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadObservations(nextPage, true, typeFilter);
  };

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

  const loadObservations = async (pageIndex: number = 0, append: boolean = false, currentFilters: string[] = typeFilter) => {
    if (pageIndex === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    try {
      const pIds = currentPatientId ? [currentPatientId] : [];
      if (pIds.length === 0) {
        setLoading(false);
        setLoadingMore(false);
        return;
      }
        
      const PAGE_SIZE = 20;
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let queryBuilder = supabase
        .from("observaciones")
        .select(`
          id, tipo, sentimiento, severidad, registrado_por, rol_registrador, fecha_observacion, descripcion_texto, contexto, intensidad_escala,
          vinculacion:goal_observations(
            id,
            puntaje,
            direccion,
            goal:pai_goals(title)
          )
        `)
        .in("persona_autismo_id", pIds);

      if (currentFilters.length > 0) {
        queryBuilder = queryBuilder.in("tipo", currentFilters);
      }

      const { data: obsData, error: obsError } = await queryBuilder
        .order("fecha_observacion", { ascending: false })
        .range(from, to);
        
      if (obsError) {
        console.error("Error fetching observations with join:", obsError);
        let fallbackQuery = supabase
          .from("observaciones")
          .select("id, tipo, sentimiento, severidad, registrado_por, rol_registrador, fecha_observacion, descripcion_texto, contexto, intensidad_escala")
          .in("persona_autismo_id", pIds);
          
        if (currentFilters.length > 0) {
          fallbackQuery = fallbackQuery.in("tipo", currentFilters);
        }

        const { data: fallbackData } = await fallbackQuery
          .order("fecha_observacion", { ascending: false })
          .range(from, to);
        
        if (fallbackData) {
          setRealObservations(prev => append ? [...prev, ...fallbackData] : fallbackData);
          setHasMore(fallbackData.length === PAGE_SIZE);
        }
      } else if (obsData) {
        setRealObservations(prev => append ? [...prev, ...obsData] : obsData);
        setHasMore(obsData.length === PAGE_SIZE);
      }

      if (pIds && pIds.length > 0 && pIds[0]) {
        const { data: teamMembers } = await supabase
          .from("equipo_pai")
          .select("user_id, rol, invite_email")
          .eq("persona_autismo_id", pIds[0]);
      
        if (teamMembers) {
          const map: Record<string, { name: string, role: string }> = {};
          teamMembers.forEach(m => {
            if (m.user_id) {
              map[m.user_id] = {
                name: m.invite_email?.split('@')[0] || "Usuario",
                role: m.rol || "Miembro"
              };
            }
          });
          
          const currentUserName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Tú";
          const currentUserTeamData = teamMembers.find(m => m.user_id === user.id);
          const currentUserRole = currentUserTeamData?.rol || "Padre";
          map[user.id] = { name: currentUserName, role: currentUserRole };
          
          setTeamMembersMap(map);
        }
      }
    } catch (error) {
      console.error("Error loading observations:", error);
      toast.error("Error al cargar observaciones");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filtered = realObservations;

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
                const memberInfo = obs.registrado_por ? teamMembersMap[obs.registrado_por] : null;
                const authorName = memberInfo?.name || "Usuario";
                const authorRole = obs.rol_registrador || memberInfo?.role || "Miembro";

                return (
                  <ObservationCard
                    key={obs.id}
                    obs={obs}
                    authorName={authorName}
                    authorRole={authorRole}
                    onEdit={(id) => navigate(`/observations/new?edit=${id}`)}
                    onDelete={(id) => setDeleteId(id)}
                  />
                );
              })
            )}
          </div>

          {hasMore && filtered.length > 0 && (
            <div className="flex justify-center pt-8">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="h-12 px-8 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-slate-50 transition-all shadow-sm"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Sincronizando...
                  </>
                ) : (
                  "Cargar más registros"
                )}
              </Button>
            </div>
          )}

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
