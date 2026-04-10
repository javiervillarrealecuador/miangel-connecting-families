import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Download, Share2, RefreshCw } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { child, previousReports } from "@/data/mockData";

export default function ReportsPage() {
  const [type, setType] = useState("weekly");
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerated(true);
    toast.success("Resumen generado");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Reportes y Resúmenes</h1>

        {!generated && (
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4">Solicitar Resumen</h2>
            <RadioGroup value={type} onValueChange={setType} className="space-y-2 mb-4">
              {[
                { val: "daily", label: "📅 Diario (hoy)" },
                { val: "weekly", label: "📆 Semanal (últimos 7 días)" },
                { val: "monthly", label: "📊 Mensual (últimos 30 días)" },
              ].map(t => (
                <div key={t.val} className="flex items-center gap-2">
                  <RadioGroupItem value={t.val} id={`rep-${t.val}`} />
                  <Label htmlFor={`rep-${t.val}`} className="text-sm">{t.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <Button className="w-full btn-touch" onClick={handleGenerate}>Generar Resumen</Button>
          </div>
        )}

        {generated && (
          <div className="bg-card border rounded-lg p-6 mb-6 animate-fade-in">
            <div className="text-center border-b pb-4 mb-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumen Semanal</p>
              <p className="font-bold text-foreground">1 - 7 de Abril 2026</p>
              <p className="text-sm text-muted-foreground">{child.name} ({child.age} años)</p>
            </div>

            <section className="mb-5">
              <h3 className="font-semibold text-foreground mb-2">📋 Resumen Ejecutivo</h3>
              <p className="text-sm text-muted-foreground">
                Esta semana, Lucas mostró buen progreso en coordinación motora, con aumento en concentración durante actividades estructuradas. Se detectaron patrones de comportamiento sensorial repetitivo que requieren atención.
              </p>
            </section>

            <section className="mb-5">
              <h3 className="font-semibold text-foreground mb-2">📈 Cambios en Comportamiento</h3>
              <div className="space-y-1 text-sm">
                <p className="text-success">✅ Menos rabietas en transiciones (3 a 1 esta semana)</p>
                <p className="text-success">✅ Mayor concentración: 12 min promedio</p>
                <p className="text-warning">⚠️ Aumento en comportamiento sensorial repetitivo</p>
              </div>
            </section>

            <section className="mb-5">
              <h3 className="font-semibold text-foreground mb-2">🎨 Principales Actividades</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• "Juego de manos con arena" (3 veces, efectividad 8/10)</p>
                <p>• "Respiración guiada" (4 veces, efectividad 7/10)</p>
                <p>• "Enhebrado de perlas" (2 veces, efectividad 9/10)</p>
              </div>
            </section>

            <section className="mb-5">
              <h3 className="font-semibold text-foreground mb-2">🎯 Objetivos Avanzados</h3>
              <div className="space-y-1 text-sm">
                <p>🎯 Coordinación Motora Fina: 45% → 52% <span className="text-success">(↑7%)</span></p>
                <p>🎯 Transiciones Emocionales: 70% → 75% <span className="text-success">(↑5%)</span></p>
                <p>🎯 Lenguaje Expresivo: 60% <span className="text-muted-foreground">(sin cambios)</span></p>
              </div>
            </section>

            <section className="mb-5">
              <h3 className="font-semibold text-foreground mb-2">🔍 Patrones Detectados</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• El niño responde mejor a actividades en la mañana (antes de 11am)</p>
                <p>• Comportamiento sensorial aumenta con cambios de rutina</p>
                <p>• Refuerza bien con actividades acuáticas</p>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="font-semibold text-foreground mb-2">💡 Recomendaciones</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Aumentar frecuencia de "Juego de manos" (2x → 3x diarias)</p>
                <p>• Introducir: "Rompecabezas de 10 piezas"</p>
                <p>• Revisar rutina matutina para reducir transiciones abruptas</p>
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              <Button className="btn-touch flex-1" onClick={() => toast.success("PDF descargado")}>
                <Download size={16} className="mr-2" /> Descargar PDF
              </Button>
              <Button variant="outline" className="btn-touch flex-1" onClick={() => toast.success("Enlace copiado")}>
                <Share2 size={16} className="mr-2" /> Compartir
              </Button>
              <Button variant="outline" className="btn-touch" onClick={() => setGenerated(false)}>
                <RefreshCw size={16} className="mr-2" /> Otro
              </Button>
            </div>
          </div>
        )}

        <div>
          <h2 className="font-semibold text-foreground mb-3">Historial de Reportes</h2>
          <div className="space-y-2">
            {previousReports.map(r => (
              <div key={r.id} className="bg-card border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Resumen {r.type}</p>
                  <p className="text-xs text-muted-foreground">{r.period}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Ver</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Descargado")}>
                    <Download size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
