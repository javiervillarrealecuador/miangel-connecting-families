import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { observations, timeAgo } from "@/data/mockData";

const typeOptions = ["Lenguaje", "Social", "Motor", "Comportamiento", "Sensorial", "Adaptativo"];

export default function ObservationsPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = typeFilter.length > 0
    ? observations.filter(o => typeFilter.includes(o.type))
    : observations;

  const severityColor: Record<string, string> = {
    baja: "text-success bg-success/10",
    normal: "text-warning bg-warning/10",
    alta: "text-warning bg-warning/10",
    critica: "text-critical bg-critical/10",
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Observaciones</h1>
          <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)}>
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="bg-card border rounded-lg p-4 mb-4 animate-fade-in">
            <p className="text-sm font-medium mb-2">Filtrar por tipo:</p>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${typeFilter.includes(t) ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {typeFilter.length > 0 && (
              <button className="text-xs text-secondary mt-2 hover:underline" onClick={() => setTypeFilter([])}>Limpiar filtros</button>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">Mostrando {filtered.length} de {observations.length} observaciones</p>

        <div className="space-y-3">
          {filtered.map(obs => (
            <div key={obs.id} className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{obs.icon}</span>
                  <span className="font-medium text-sm text-foreground">{obs.type}</span>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(obs.timestamp)}</span>
              </div>
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`h-2 w-4 rounded-sm ${i <= obs.intensity ? "bg-primary" : "bg-muted"}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-2">({obs.intensity}/5)</span>
              </div>
              <p className="text-sm text-foreground mb-3">{obs.description}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">📍 {obs.context}</span>
                <span className={`px-2 py-0.5 rounded-full capitalize ${severityColor[obs.severity] || ""}`}>
                  🔔 {obs.severity}
                </span>
                {obs.hasAudio && <span className="text-secondary">🎧 Audio</span>}
              </div>
            </div>
          ))}
        </div>

        {/* FAB */}
        <button
          onClick={() => navigate("/observations/new")}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-20"
        >
          <Plus size={24} />
        </button>
      </div>
    </AppLayout>
  );
}
