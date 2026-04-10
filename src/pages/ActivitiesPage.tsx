import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { suggestedActivities } from "@/data/mockData";

const contextSuggestions = ["parque", "piscina", "cocina", "casa", "escuela", "consultorio", "playa", "patio"];

export default function ActivitiesPage() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [showSugg, setShowSugg] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [rating, setRating] = useState([3]);

  const filtered = contextSuggestions.filter(s => s.includes(query.toLowerCase()) && query.length > 0);

  const results = searched
    ? suggestedActivities.filter(a =>
        a.contexts.some(c => c.toLowerCase().includes(query.toLowerCase())) || query.length === 0
      )
    : [];

  const handleSearch = () => {
    if (!query) return;
    setSearched(true);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        {!searched && (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-2">¿Dónde estás con tu hijo?</h1>
            <p className="text-muted-foreground mb-8">Buscaremos actividades para reforzar sus objetivos en ese contexto</p>
          </div>
        )}

        {searched && <h1 className="text-2xl font-bold text-foreground mb-6">Actividades</h1>}

        <div className="relative mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                className="h-12 text-base"
                placeholder="Ej: parque, piscina, cocina de casa"
                value={query}
                onChange={e => { setQuery(e.target.value); setShowSugg(true); setSearched(false); }}
                onFocus={() => setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 200)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
              {showSugg && filtered.length > 0 && (
                <div className="absolute z-10 w-full bg-card border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {filtered.map(s => (
                    <button key={s} className="w-full text-left px-4 py-2 text-sm hover:bg-muted capitalize" onClick={() => { setQuery(s); setShowSugg(false); }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button className="h-12 btn-touch px-6" onClick={handleSearch}>
              <Search size={18} className="mr-2" /> Buscar
            </Button>
          </div>
        </div>

        {searched && (
          <div className="animate-fade-in">
            <p className="text-sm text-muted-foreground mb-4">
              Encontramos {results.length} actividades para <span className="font-medium capitalize">{query}</span>
            </p>
            <div className="space-y-4">
              {results.map(act => (
                <div key={act.id} className="bg-card border rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{act.icon}</span>
                    <h3 className="font-semibold text-foreground">{act.name}</h3>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <p><span className="font-medium text-foreground">Objetivo:</span> {act.objective}</p>
                    <p><span className="font-medium text-foreground">Contexto:</span> {act.contexts.join(", ")}</p>
                    <p><span className="font-medium text-foreground">Duración:</span> ~{act.duration}</p>
                  </div>
                  <p className="text-sm text-foreground mb-3">{act.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span>📊 Efectividad: {"⭐".repeat(Math.round(act.effectiveness / 2))}{"☆".repeat(5 - Math.round(act.effectiveness / 2))} ({act.effectiveness}/10)</span>
                    <span>🔗 {act.source}</span>
                  </div>

                  {feedbackId === act.id ? (
                    <div className="bg-muted p-3 rounded-lg space-y-3 animate-fade-in">
                      <p className="text-sm font-medium">¿Qué tal funcionó?</p>
                      <div className="text-center">
                        <span className="text-2xl font-bold text-foreground">{rating[0]}/5</span>
                      </div>
                      <Slider value={rating} onValueChange={setRating} min={1} max={5} step={1} />
                      <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => { setFeedbackId(null); toast.success("✓ Guardada"); }}>
                        Guardar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Ver Detalles</Button>
                      <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => setFeedbackId(act.id)}>
                        ¡Lo Hicimos!
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {results.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-4xl mb-2">🔍</p>
                  <p>No encontramos actividades para ese contexto. Intenta con otro.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
