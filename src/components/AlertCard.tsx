import { CheckCircle2, AlertTriangle, Info, Sparkles, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import React from "react";

const severityConfig: Record<string, { icon: React.ReactNode; label: string; className: string; color: string }> = {
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

interface AlertCardProps {
  alert: {
    id: string;
    severidad: string;
    created_at: string;
    tipo: string;
    descripcion: string;
    accion_sugerida?: string;
  };
  read: boolean;
  onMarkRead: (id: string) => void;
}

export default function AlertCard({ alert, read, onMarkRead }: AlertCardProps) {
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
          {(() => {
            if (!alert.created_at) return "PENDIENTE";
            const d = new Date(alert.created_at);
            if (isNaN(d.getTime())) return "PENDIENTE";
            return d.toLocaleDateString("es-EC", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          })()}
        </span>
      </div>
      <h3 className="font-bold text-foreground text-sm mb-1">{typeLabels[alert.tipo] || "Notificación PAI"}</h3>
      <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{alert.descripcion}</p>
      
      {alert.accion_sugerida && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
            <Sparkles size={14} />
          </div>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Recomendación Clínica</p>
            <p className="text-xs text-foreground/80 font-semibold leading-relaxed">{alert.accion_sugerida}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!read && (
          <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold rounded-lg bg-white" onClick={() => onMarkRead(alert.id)}>
            MARCAR LEÍDA
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold text-muted-foreground hover:bg-black/5" onClick={() => toast.info("Función de archivo próximamente")}>
          <Archive size={12} className="mr-1" /> ARCHIVAR
        </Button>
      </div>
    </div>
  );
}
