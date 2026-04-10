import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { alerts as initialAlerts, timeAgo } from "@/data/mockData";

const severityConfig: Record<string, { icon: string; label: string; className: string }> = {
  critical: { icon: "🔴", label: "CRÍTICA", className: "bg-critical/10 border-critical/20" },
  high: { icon: "🟠", label: "ALTA", className: "bg-warning/10 border-warning/20" },
  normal: { icon: "🟡", label: "NORMAL", className: "bg-muted" },
  low: { icon: "🟢", label: "BAJA", className: "bg-success/5" },
};

export default function AlertsPage() {
  const [alertsList, setAlertsList] = useState(initialAlerts);

  const markRead = (id: string) => {
    setAlertsList(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    toast.success("Marcada como leída");
  };

  const archive = (id: string) => {
    setAlertsList(prev => prev.map(a => a.id === id ? { ...a, archived: true, read: true } : a));
    toast.success("Archivada");
  };

  const all = alertsList.filter(a => !a.archived);
  const unread = alertsList.filter(a => !a.read && !a.archived);
  const critical = alertsList.filter(a => a.severity === "critical" && !a.archived);
  const archived = alertsList.filter(a => a.archived);

  const AlertCard = ({ alert }: { alert: typeof initialAlerts[0] }) => {
    const cfg = severityConfig[alert.severity] || severityConfig.normal;
    return (
      <div className={`border rounded-lg p-4 ${cfg.className} ${!alert.read ? "ring-1 ring-primary/20" : ""}`}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-bold uppercase">{cfg.icon} {cfg.label}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(alert.timestamp)}</span>
        </div>
        <p className="font-medium text-foreground text-sm mb-1">{alert.title}</p>
        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
        {alert.action && (
          <div className="bg-card/50 rounded p-2 mb-3">
            <p className="text-xs font-medium text-foreground">Acción sugerida:</p>
            <p className="text-xs text-muted-foreground">{alert.action}</p>
          </div>
        )}
        <div className="flex gap-2">
          {!alert.read && (
            <button className="text-xs text-secondary hover:underline" onClick={() => markRead(alert.id)}>Marcar leída</button>
          )}
          {!alert.archived && (
            <button className="text-xs text-muted-foreground hover:underline" onClick={() => archive(alert.id)}>Archivar</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-6">Centro de Alertas</h1>
        <Tabs defaultValue="all">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="all">Todas ({all.length})</TabsTrigger>
            <TabsTrigger value="unread">No Leídas ({unread.length})</TabsTrigger>
            <TabsTrigger value="critical">Críticas ({critical.length})</TabsTrigger>
            <TabsTrigger value="archived">Archivadas ({archived.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-3">{all.map(a => <AlertCard key={a.id} alert={a} />)}</TabsContent>
          <TabsContent value="unread" className="space-y-3">{unread.length > 0 ? unread.map(a => <AlertCard key={a.id} alert={a} />) : <p className="text-center text-muted-foreground py-8">Sin alertas no leídas 🎉</p>}</TabsContent>
          <TabsContent value="critical" className="space-y-3">{critical.length > 0 ? critical.map(a => <AlertCard key={a.id} alert={a} />) : <p className="text-center text-muted-foreground py-8">Sin alertas críticas</p>}</TabsContent>
          <TabsContent value="archived" className="space-y-3">{archived.map(a => <AlertCard key={a.id} alert={a} />)}</TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
