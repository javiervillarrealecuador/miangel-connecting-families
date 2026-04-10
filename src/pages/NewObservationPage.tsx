import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Mic, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { teamMembers } from "@/data/mockData";

const obsTypes = [
  { id: "lenguaje", label: "Lenguaje", icon: "🗣️" },
  { id: "social", label: "Social", icon: "🤝" },
  { id: "motor", label: "Motor", icon: "🏃" },
  { id: "comportamiento", label: "Comportamiento", icon: "😊" },
  { id: "sensorial", label: "Sensorial", icon: "👂" },
  { id: "adaptativo", label: "Adaptativo", icon: "🪴" },
];

const contextSuggestions = ["casa", "escuela", "parque", "piscina", "consultorio", "calle", "cocina", "dormitorio", "sala", "comedor"];

const intensityLabels = [
  { emoji: "😊", label: "Leve", color: "text-success" },
  { emoji: "🙂", label: "Moderada", color: "text-success" },
  { emoji: "😐", label: "Normal", color: "text-muted-foreground" },
  { emoji: "😟", label: "Alta", color: "text-warning" },
  { emoji: "😠", label: "Crítica", color: "text-critical" },
];

export default function NewObservationPage() {
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [context, setContext] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [description, setDescription] = useState("");
  const [intensity, setIntensity] = useState([3]);
  const [hasAudio, setHasAudio] = useState(false);
  const [recording, setRecording] = useState(false);
  const [severity, setSeverity] = useState("normal");
  const [notifyIds, setNotifyIds] = useState(teamMembers.map(m => m.id));

  const filtered = contextSuggestions.filter(s => s.includes(context.toLowerCase()) && context.length > 0);
  const canSave = type && context && description;
  const intIdx = intensity[0] - 1;

  const handleRecord = () => {
    setRecording(true);
    setTimeout(() => { setRecording(false); setHasAudio(true); }, 2000);
  };

  const handleSave = () => {
    toast.success("✓ Observación guardada. Se notificó al equipo.");
    navigate("/dashboard");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Registrar Observación</h1>

        {/* Type */}
        <div className="mb-6">
          <Label className="mb-2 block">Tipo de Observación</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {obsTypes.map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`p-3 rounded-lg border text-sm font-medium text-center transition-colors ${type === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}
              >
                <span className="text-lg block mb-1">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Context */}
        <div className="mb-6 relative">
          <Label>¿Dónde está tu hijo en este momento?</Label>
          <input
            className="mt-1 w-full h-12 px-4 text-base border border-input rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 bg-card"
            placeholder="Ej: parque, dormitorio de casa, escuela aula 4"
            value={context}
            onChange={e => { setContext(e.target.value); setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute z-10 w-full bg-card border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
              {filtered.map(s => (
                <button key={s} className="w-full text-left px-4 py-2 text-sm hover:bg-muted capitalize" onClick={() => { setContext(s); setShowSuggestions(false); }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <Label>¿Qué observaste?</Label>
          <Textarea
            className="mt-1"
            rows={4}
            maxLength={500}
            placeholder="Ej: Rabieta porque quería cereal que no hay. Lloró durante 5 minutos..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{description.length}/500</p>
        </div>

        {/* Intensity */}
        <div className="mb-6">
          <Label>Intensidad del comportamiento/situación</Label>
          <div className="mt-3 text-center">
            <span className={`text-4xl block ${intensityLabels[intIdx].color}`}>{intensityLabels[intIdx].emoji}</span>
            <span className="text-2xl font-bold text-foreground">{intensity[0]}</span>
            <span className={`text-sm block ${intensityLabels[intIdx].color}`}>{intensityLabels[intIdx].label}</span>
          </div>
          <Slider value={intensity} onValueChange={setIntensity} min={1} max={5} step={1} className="mt-3" />
        </div>

        {/* Audio */}
        <div className="mb-6">
          <Label>Agregar audio (opcional)</Label>
          <div className="mt-2">
            {!hasAudio ? (
              <Button variant="outline" onClick={handleRecord} disabled={recording} className="btn-touch">
                <Mic size={18} className="mr-2" />
                {recording ? "Grabando..." : "🎤 Grabar"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm">📁 audio_obs.wav</span>
                <button onClick={() => setHasAudio(false)} className="ml-auto text-muted-foreground hover:text-foreground"><X size={16} /></button>
              </div>
            )}
          </div>
        </div>

        {/* Severity */}
        <div className="mb-6">
          <Label>¿Esta observación requiere alerta urgente?</Label>
          <RadioGroup value={severity} onValueChange={setSeverity} className="mt-2 space-y-2">
            {[
              { val: "baja", label: "🟢 Baja (información general)" },
              { val: "normal", label: "🟡 Normal (cambio leve)" },
              { val: "alta", label: "🟠 Alta (cambio significativo)" },
              { val: "critica", label: "🔴 Crítica (comportamiento peligroso)" },
            ].map(s => (
              <div key={s.val} className="flex items-center gap-2">
                <RadioGroupItem value={s.val} id={`sev-${s.val}`} />
                <Label htmlFor={`sev-${s.val}`} className="text-sm">{s.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Notify */}
        <div className="mb-8">
          <Label>Notificar a:</Label>
          <div className="mt-2 space-y-2">
            {teamMembers.map(m => (
              <div key={m.id} className="flex items-center gap-2">
                <Checkbox
                  id={`notify-${m.id}`}
                  checked={notifyIds.includes(m.id)}
                  onCheckedChange={() =>
                    setNotifyIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])
                  }
                />
                <Label htmlFor={`notify-${m.id}`} className="text-sm">{m.name} ({m.role})</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full btn-touch bg-success text-success-foreground hover:bg-success/90" disabled={!canSave} onClick={handleSave}>
            Guardar Observación
          </Button>
          <Button variant="outline" className="w-full btn-touch" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
