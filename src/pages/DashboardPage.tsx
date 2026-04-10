import { useNavigate } from "react-router-dom";
import { Target, Eye, Bell, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { activeGoal, observations, alerts, timeAgo } from "@/data/mockData";

export default function DashboardPage() {
  const navigate = useNavigate();
  const unreadAlerts = alerts.filter(a => !a.read && !a.archived).length;
  const lastObs = observations[0];

  const timeline = [
    { icon: "✓", text: `Observación registrada: ${lastObs.type} en ${lastObs.context} (intensidad ${lastObs.intensity})`, time: timeAgo(lastObs.timestamp) },
    { icon: "👥", text: "María invitó a Terapeuta Dr. García (pendiente verificación)", time: "Hace 6h" },
    { icon: "🎯", text: `Objetivo '${activeGoal.title}' actualizado: 45% → 50%`, time: "Hace 1 día" },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card-stat bg-primary/5 border-primary/10 cursor-pointer" onClick={() => navigate("/goals")}>
            <div className="flex items-center gap-2 text-primary mb-2"><Target size={18} /><span className="text-sm font-medium">Objetivo Activo</span></div>
            <p className="font-semibold text-foreground text-sm">{activeGoal.title}</p>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${activeGoal.progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{activeGoal.progress}% completado</p>
          </div>

          <div className="card-stat bg-success/5 border-success/10 cursor-pointer" onClick={() => navigate("/observations")}>
            <div className="flex items-center gap-2 text-success mb-2"><Eye size={18} /><span className="text-sm font-medium">Última Observación</span></div>
            <p className="font-semibold text-foreground text-sm">{lastObs.type} · {lastObs.context}</p>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo(lastObs.timestamp)}</p>
            <div className="flex gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-2 w-5 rounded-sm ${i <= lastObs.intensity ? "bg-success" : "bg-muted"}`} />
              ))}
            </div>
          </div>

          <div className="card-stat bg-warning/5 border-warning/10 cursor-pointer" onClick={() => navigate("/alerts")}>
            <div className="flex items-center gap-2 text-warning mb-2"><Bell size={18} /><span className="text-sm font-medium">Alertas</span></div>
            <p className="font-semibold text-foreground text-sm">{unreadAlerts} Alerta{unreadAlerts !== 1 ? "s" : ""} no leída{unreadAlerts !== 1 ? "s" : ""}</p>
            <button className="text-xs text-secondary hover:underline mt-1">Ir a alertas →</button>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Hoy</h2>
          <div className="space-y-3">
            {timeline.map((ev, i) => (
              <div key={i} className="flex gap-3 items-start p-3 bg-card rounded-lg border">
                <span className="text-lg">{ev.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{ev.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ev.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <Button className="w-full btn-touch bg-warning text-warning-foreground hover:bg-warning/90" onClick={() => navigate("/observations/new")}>
            <Plus size={18} className="mr-2" /> Nueva Observación
          </Button>
          <Button variant="outline" className="w-full btn-touch" onClick={() => navigate("/activities/search")}>
            <Search size={18} className="mr-2" /> Buscar Actividad
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
