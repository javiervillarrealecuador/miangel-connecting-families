import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { Bell, Archive, CheckCircle2, AlertTriangle, Info, Sparkles } from "lucide-react";

const severityConfig: Record<string, { icon: any; label: string; className: string; color: string }> = {
  critica: { icon: <AlertTriangle className="text-red-600" size={16} />, label: "CRÍTICA", className: "bg-red-50 border-red-100", color: "text-red-700" },
  alta: { icon: <AlertTriangle className="text-orange-600" size={16} />, label: "ALTA", className: "bg-orange-50 border-orange-100", color: "text-orange-700" },
  normal: { icon: <Info className="text-blue-600" size={16} />, label: "NORMAL", className: "bg-blue-50 border-blue-100", color: "text-blue-700" },
  baja: { icon: <CheckCircle2 className="text-green-600" size={16} />, label: "BAJA", className: "bg-green-50 border-green-100", color: "text-green-700" },
};

const typeLabels: Record<string, string> = {
  nueva_observacion: "Nueva Observación",
  cambio_comportamiento: "Cambio de Comportamiento",
  patron_detectado: "Patrón Detectado",
  objetivo_proximo_vencer: "Objetivo Próximo a Vencer",
  regresion: "Regresión Detectada",
  sugerencia_estrategia: "Sugerencia de Estrategia"
};

export default function AlertsPage() {
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadAlerts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: teamData } = await supabase
        .from("equipo_pai")
        .select("familia_id")
        .eq("user_id", user.id);

      if (teamData && teamData.length > 0) {
        const fIds = teamData.map(t => t.familia_id);
        const { data: alerts, error } = await supabase
          .from("alertas")
          .select("*")
          .in("familia_id", fIds)
          .order("created_at", { ascending: false });

        if (error) {
          toast.error("Error al cargar alertas");
        } else {
          setAlertsList(alerts || []);
        }
      }
      setLoading(false);
    };

    loadAlerts();
  }, []);

  const markRead = async (id: string) => {
    if (!currentUserId) return;
    
    const alert = alertsList.find(a => a.id === id);
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
      setAlertsList(prev => prev.map(a => a.id === id ? { ...a, leida_por: newLeidaPor } : a));
      toast.success("Marcada como leída");
    }
  };

  const isRead = (alert: any) => alert.leida_por?.includes(currentUserId);

  const all = alertsList;
  const unread = alertsList.filter(a => !isRead(a));
  const critical = alertsList.filter(a => a.severidad === "critica");

  const AlertCard = ({ alert }: { alert: any }) => {
    const read = isRead(alert);
    const cfg = severityConfig[alert.severidad] || severityConfig.normal;
    
    return (
      <div className={`border-2 rounded-2xl p-5 transition-all ${cfg.className} ${!read ? "ring-2 ring-primary/10 shadow-md" : "opacity-60 grayscale-[0.5]"}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {read ? <CheckCircle2 className="text-green-600" size={16} /> : cfg.icon}
            <span className={`text-[10px] font-black uppercase tracking-widest ${read ? "text-green-700" : cfg.color}`}>
              {read ? "ATENDIDA" : cfg.label}
            </span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            {new Date(alert.created_at).toLocaleDateString("es-EC", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <h3 className="font-bold text-foreground text-sm mb-1">{typeLabels[alert.tipo] || "Notificación PAI"}</h3>
        <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{alert.descripcion}</p>
        
        {alert.accion_sugerida && (
          <div className="bg-primary/5 border-2 border-primary/10 rounded-2xl p-4 mb-4 flex items-start gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Sparkles size={14} />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Recomendación Clínica</p>
              <p className="text-xs text-foreground/80 font-medium leading-relaxed">{alert.accion_sugerida}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {!isRead(alert) && (
            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold rounded-lg bg-white" onClick={() => markRead(alert.id)}>
              MARCAR LEÍDA
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold text-muted-foreground hover:bg-black/5" onClick={() => toast.info("Función de archivo próximamente")}>
            <Archive size={12} className="mr-1" /> ARCHIVAR
          </Button>
        </div>
      </div>
    );
  };

  const handleCreateTestAlert = async () => {
    if (!currentUserId) return;
    setLoading(true);
    
    // Obtenemos el familia_id de la cuenta activa
    const { data: teamData } = await supabase
      .from("equipo_pai")
      .select("familia_id")
      .eq("user_id", currentUserId)
      .not("familia_id", "is", null)
      .limit(1);

    if (teamData && teamData.length > 0) {
      const targetFamilyId = teamData[0].familia_id;
      
      const { error } = await supabase.from("alertas").insert({
        familia_id: targetFamilyId,
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
        // En lugar de reload, volvemos a cargar los datos
        const { data: newAlerts } = await supabase
          .from("alertas")
          .select("*")
          .eq("familia_id", targetFamilyId)
          .order("created_at", { ascending: false });
        setAlertsList(newAlerts || []);
      }
    } else {
      toast.error("No se encontró familia_id. ¿Terminaste el onboarding?");
    }
    setLoading(false);
  };

  if (loading) return <AppLayout><div className="p-8 animate-pulse text-muted-foreground">Cargando histórico...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="animate-fade-in pb-10 max-w-2xl">
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

        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger value="unread" className="rounded-lg font-bold text-xs">No Leídas ({unread.length})</TabsTrigger>
            <TabsTrigger value="critical" className="rounded-lg font-bold text-xs text-red-600">Críticas ({critical.length})</TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg font-bold text-xs">Todas ({all.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {unread.length > 0 ? unread.map(a => <AlertCard key={a.id} alert={a} />) : (
              <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
                <p className="text-5xl mb-4">🎉</p>
                <p className="font-bold text-muted-foreground">¡Estás al día! No hay alertas pendientes.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="critical" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {critical.length > 0 ? critical.map(a => <AlertCard key={a.id} alert={a} />) : (
              <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
                <p className="text-5xl mb-4">🛡️</p>
                <p className="font-bold text-muted-foreground">No se han detectado situaciones críticas.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {all.length > 0 ? all.map(a => <AlertCard key={a.id} alert={a} />) : (
              <p className="text-center text-muted-foreground py-8">No hay historial de alertas.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
