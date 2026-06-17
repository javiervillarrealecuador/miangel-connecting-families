import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { Bell, Loader2 } from "lucide-react";
import AlertCard from "@/components/AlertCard";
import { usePatient } from "@/contexts/PatientContext";

export default function AlertsPage() {
  const [unreadAlerts, setUnreadAlerts] = useState<any[]>([]);
  const [unreadPage, setUnreadPage] = useState(0);
  const [unreadHasMore, setUnreadHasMore] = useState(true);

  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [criticalPage, setCriticalPage] = useState(0);
  const [criticalHasMore, setCriticalHasMore] = useState(true);

  const [allAlerts, setAllAlerts] = useState<any[]>([]);
  const [allPage, setAllPage] = useState(0);
  const [allHasMore, setAllHasMore] = useState(true);

  const [counts, setCounts] = useState({ unread: 0, critical: 0, all: 0 });
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({ unread: false, critical: false, all: false });
  const [activeTab, setActiveTab] = useState("unread");
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { currentPatientId, currentFamilyId } = usePatient();

  useEffect(() => {
    const init = async () => {
      if (!currentPatientId) return;
      setLoading(true);
      await loadCounts();
      await loadAlertsPage("unread", 0, false);
      setLoading(false);
    };
    init();
  }, [currentPatientId]);

  const loadCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !currentFamilyId || !currentPatientId) return;
    setCurrentUserId(user.id);

    const [{ count: unread }, { count: critical }, { count: all }] = await Promise.all([
      supabase.from("alertas").select("id", { count: 'exact', head: true }).eq("familia_id", currentFamilyId).eq("persona_autismo_id", currentPatientId).or(`leida_por.is.null,not.leida_por.cs.{"${user.id}"}`),
      supabase.from("alertas").select("id", { count: 'exact', head: true }).eq("familia_id", currentFamilyId).eq("persona_autismo_id", currentPatientId).eq("severidad", "critica"),
      supabase.from("alertas").select("id", { count: 'exact', head: true }).eq("familia_id", currentFamilyId).eq("persona_autismo_id", currentPatientId)
    ]);
    
    setCounts({
      unread: unread || 0,
      critical: critical || 0,
      all: all || 0
    });
  };

  const loadAlertsPage = async (category: "unread" | "critical" | "all", pageIndex: number = 0, append: boolean = false) => {
    if (pageIndex === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !currentFamilyId || !currentPatientId) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    setCurrentUserId(user.id);

    const PAGE_SIZE = 20;
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let queryBuilder = supabase
      .from("alertas")
      .select("id, severidad, created_at, tipo, descripcion, accion_sugerida, leida_por, familia_id")
      .eq("familia_id", currentFamilyId)
      .eq("persona_autismo_id", currentPatientId)
      .order("created_at", { ascending: false });

    if (category === "unread") {
      queryBuilder = queryBuilder.or(`leida_por.is.null,not.leida_por.cs.{"${user.id}"}`);
    } else if (category === "critical") {
      queryBuilder = queryBuilder.eq("severidad", "critica");
    }

    const { data: alerts, error } = await queryBuilder.range(from, to);

    if (error) {
      toast.error("Error al cargar alertas");
    } else if (alerts) {
      if (category === "unread") {
        setUnreadAlerts(prev => append ? [...prev, ...alerts] : alerts);
        setUnreadHasMore(alerts.length === PAGE_SIZE);
        setUnreadPage(pageIndex);
      } else if (category === "critical") {
        setCriticalAlerts(prev => append ? [...prev, ...alerts] : alerts);
        setCriticalHasMore(alerts.length === PAGE_SIZE);
        setCriticalPage(pageIndex);
      } else {
        setAllAlerts(prev => append ? [...prev, ...alerts] : alerts);
        setAllHasMore(alerts.length === PAGE_SIZE);
        setAllPage(pageIndex);
      }
      setLoadedTabs(prev => ({ ...prev, [category]: true }));
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    if (activeTab === "unread") {
      loadAlertsPage("unread", unreadPage + 1, true);
    } else if (activeTab === "critical") {
      loadAlertsPage("critical", criticalPage + 1, true);
    } else {
      loadAlertsPage("all", allPage + 1, true);
    }
  };

  const markRead = async (id: string) => {
    if (!currentUserId) return;
    
    const alert = unreadAlerts.find(a => a.id === id) || criticalAlerts.find(a => a.id === id) || allAlerts.find(a => a.id === id);
    if (!alert) return;

    const newLeidaPor = Array.isArray(alert.leida_por) 
      ? [...new Set([...alert.leida_por, currentUserId])]
      : [currentUserId];

    const { error } = await supabase
      .from("alertas")
      .update({ leida_por: newLeidaPor })
      .eq("id", id);

    if (error) {
      toast.error("Error al marcar como leída");
    } else {
      setUnreadAlerts(prev => prev.filter(a => a.id !== id));
      setCriticalAlerts(prev => prev.map(a => a.id === id ? { ...a, leida_por: newLeidaPor } : a));
      setAllAlerts(prev => prev.map(a => a.id === id ? { ...a, leida_por: newLeidaPor } : a));

      setCounts(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));

      toast.success("Marcada como leída");
    }
  };

  const isRead = (alert: any) => alert.leida_por?.includes(currentUserId);

  const handleCreateTestAlert = async () => {
    if (!currentUserId || !currentFamilyId || !currentPatientId) return;
    setLoading(true);
    
    const { error } = await supabase.from("alertas").insert({
      familia_id: currentFamilyId,
      persona_autismo_id: currentPatientId,
      tipo: "patron_detectado",
      severidad: "critica",
      descripcion: `ALERTA DE PRUEBA (${new Date().toLocaleTimeString()}): Conexión verificada.`,
      accion_sugerida: "Si ves esto, el sistema de alertas está funcionando perfectamente."
    });

    if (error) {
      toast.error("Error RLS: No tienes permiso para insertar en la base de datos.");
      console.error(error);
    } else {
      toast.success("¡Alerta creada con éxito!");
      await loadCounts();
      await loadAlertsPage(activeTab as any, 0, false);
    }
    setLoading(false);
  };

  const getActiveTabHasMore = () => {
    if (activeTab === "unread") return unreadHasMore && unreadAlerts.length > 0;
    if (activeTab === "critical") return criticalHasMore && criticalAlerts.length > 0;
    return allHasMore && allAlerts.length > 0;
  };

  if (loading && unreadAlerts.length === 0 && criticalAlerts.length === 0 && allAlerts.length === 0) {
    return (
      <AppLayout>
        <div className="p-8 animate-pulse text-muted-foreground flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="font-black text-xs uppercase">Cargando histórico...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in pb-20 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Bell size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Histórico de Alertas</h1>
              <p className="text-xs text-muted-foreground font-medium">Gestiona y revisa todas las notificaciones de mIAngel</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleCreateTestAlert} className="text-[10px] font-bold border-dashed">
            PROBAR CONEXIÓN
          </Button>
        </div>

        <Tabs 
          defaultValue="unread" 
          value={activeTab} 
          onValueChange={(val) => {
            setActiveTab(val);
            if (!loadedTabs[val]) {
              loadAlertsPage(val as any, 0, false);
            }
          }} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger value="unread" className="rounded-lg font-bold text-xs">No Leídas ({counts.unread})</TabsTrigger>
            <TabsTrigger value="critical" className="rounded-lg font-bold text-xs text-red-600">Críticas ({counts.critical})</TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg font-bold text-xs">Todas ({counts.all})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {unreadAlerts.length > 0 ? unreadAlerts.map(a => <AlertCard key={a.id} alert={a} read={isRead(a)} onMarkRead={markRead} />) : (
              <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
                <p className="text-5xl mb-4">🎉</p>
                <p className="font-bold text-muted-foreground">¡Estás al día! No hay alertas pendientes.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="critical" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {criticalAlerts.length > 0 ? criticalAlerts.map(a => <AlertCard key={a.id} alert={a} read={isRead(a)} onMarkRead={markRead} />) : (
              <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
                <p className="text-5xl mb-4">🛡️</p>
                <p className="font-bold text-muted-foreground">No se han detectado situaciones críticas.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {allAlerts.length > 0 ? allAlerts.map(a => <AlertCard key={a.id} alert={a} read={isRead(a)} onMarkRead={markRead} />) : (
              <p className="text-center text-muted-foreground py-8">No hay historial de alertas.</p>
            )}
          </TabsContent>
        </Tabs>

        {getActiveTabHasMore() && (
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
                "Cargar más alertas"
              )}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
