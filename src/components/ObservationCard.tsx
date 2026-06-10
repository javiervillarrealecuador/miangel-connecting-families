import React from "react";
import { 
  Smile, Frown, Meh, Angry, Wind, Target, RotateCcw, Activity, 
  MessageSquare, User, Calendar, MoreVertical, Edit2, Trash2, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { timeAgo } from "@/data/mockData";

const severityStyles: Record<string, string> = {
  baja: "text-success bg-success/10 border-success/20",
  normal: "text-blue-500 bg-blue-50 border-blue-100",
  alta: "text-warning bg-warning/10 border-warning/20",
  critica: "text-critical bg-critical/10 border-critical/20 font-black",
};

const typeIcons: Record<string, React.ReactNode> = {
  lenguaje: <MessageSquare size={16} />,
  social: <Smile size={16} />,
  motor: <Activity size={16} />,
  comportamiento: <Target size={16} />,
  sensorial: <Wind size={16} />,
  adaptativo: <RotateCcw size={16} />
};

const sentimentIcons: Record<string, React.ReactNode> = {
  positivo: <Smile className="text-success" size={24} strokeWidth={2.5} />,
  neutral: <Meh className="text-slate-400" size={24} strokeWidth={2.5} />,
  negativo: <Frown className="text-critical" size={24} strokeWidth={2.5} />,
  alegre: <Smile className="text-success" size={16} />,
  triste: <Frown className="text-blue-500" size={16} />,
  calmado: <Wind className="text-teal-500" size={16} />,
  ansioso: <Meh className="text-warning" size={16} />,
  enojado: <Angry className="text-critical" size={16} />,
};

interface ObservationCardProps {
  obs: {
    id: string;
    tipo: string;
    sentimiento?: string;
    severidad?: string;
    fecha_observacion: string;
    descripcion_texto: string;
    contexto?: string;
    intensidad_escala: number;
    vinculacion?: Array<{
      id: string;
      puntaje?: number;
      direccion?: string;
      goal?: {
        title: string;
      };
    }>;
  };
  authorName: string;
  authorRole: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ObservationCard({ obs, authorName, authorRole, onEdit, onDelete }: ObservationCardProps) {
  const vinculacion = obs.vinculacion?.[0];
  const linkedGoal = vinculacion?.goal;
  const impactVal = vinculacion?.puntaje;
  const impactDir = vinculacion?.direccion;
  
  const isPositive = impactDir === 'positivo';
  const isNegative = impactDir === 'negativo';
  const impactValNum = impactVal !== undefined && impactVal !== null ? Number(impactVal) : null;
  const displayImpact = impactValNum !== null ? (isNegative ? `-${Math.abs(impactValNum)}%` : `+${impactValNum}%`) : null;
  const displayAuthor = `${authorName} (${authorRole})`;

  return (
    <div className="relative bg-white border-2 border-slate-100 rounded-[40px] p-8 md:p-10 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all group overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="text-4xl bg-gradient-to-br from-slate-50 to-slate-100 w-16 h-16 rounded-[24px] flex items-center justify-center border-2 border-white shadow-xl group-hover:scale-110 transition-transform">
              {typeIcons[obs.tipo?.toLowerCase()] || '📝'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight leading-none">{obs.tipo}</h3>
                {linkedGoal && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 border-none">
                    <Target size={12} strokeWidth={4} />
                    Meta: {linkedGoal.title}
                  </div>
                )}
                {obs.sentimiento && (
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    {sentimentIcons[obs.sentimiento.toLowerCase()]}
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{obs.sentimiento}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${severityStyles[obs.severidad?.toLowerCase()] || severityStyles.normal}`}>
                  {obs.severidad?.toLowerCase() === 'critica' && <div className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse" />}
                  {obs.severidad || 'Normal'}
                </div>
                {displayImpact && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm cursor-help transition-all hover:scale-105 ${isPositive ? 'bg-success/10 text-success border-success/20' : isNegative ? 'bg-critical/10 text-critical border-critical/20' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        <Activity size={12} className={isPositive ? "animate-pulse" : ""} />
                        Impacto: {displayImpact}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[320px] p-5 bg-slate-900 text-white rounded-[28px] border-none shadow-2xl z-[100]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/20 rounded-lg">
                            <Target size={14} className="text-primary" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Detalle de Valoración</p>
                        </div>
                        <p className="text-xs leading-relaxed font-medium">
                          Impacto de <span className={isPositive ? "text-success font-bold" : "text-critical font-bold"}>{displayImpact}</span> calculado para la meta: <br/>
                          <span className="text-primary font-bold">"{linkedGoal?.title}"</span>.
                        </p>
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-[9px] text-slate-400 leading-tight">
                            Basado en una intensidad de <span className="text-white font-bold">{obs.intensidad_escala}/5</span> en el contexto de <span className="text-white font-bold">{obs.contexto || "General"}</span>.
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 ml-auto sm:ml-0">
            <div className="text-right hidden sm:block">
              <div className="flex flex-col items-end gap-1 mb-2">
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-white tracking-widest bg-primary px-4 py-1.5 rounded-full border shadow-lg shadow-primary/20">
                  <User size={12} strokeWidth={4} /> {displayAuthor}
                </div>
                <span className="text-[8px] font-black uppercase text-slate-400 mr-2 tracking-widest">REGISTRADO POR</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center justify-end gap-1.5">
                <Calendar size={12} /> {timeAgo(new Date(obs.fecha_observacion).getTime())}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-primary">
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl border-2 p-2 min-w-[160px] shadow-2xl">
                <DropdownMenuItem 
                  onClick={() => onEdit(obs.id)}
                  className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest gap-3 cursor-pointer focus:bg-primary/5 focus:text-primary"
                >
                  <Edit2 size={16} /> Editar Registro
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(obs.id)}
                  className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest gap-3 cursor-pointer text-critical focus:bg-critical/5 focus:text-critical"
                >
                  <Trash2 size={16} /> Eliminar Registro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mb-8 border-l-4 border-slate-200 pl-6 py-1">
          <p className="text-base md:text-lg font-semibold text-slate-800 leading-relaxed italic">
            "{obs.descripcion_texto}"
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 tracking-widest bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <MapPin size={16} className="text-primary" strokeWidth={3} />
            {obs.contexto || "General"}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mr-1">Intensidad</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i} 
                  className={`h-2.5 w-6 rounded-full transition-all duration-500 ${
                    i <= obs.intensidad_escala 
                      ? (obs.intensidad_escala >= 4 ? 'bg-gradient-to-r from-critical to-red-400 shadow-lg shadow-critical/20' : 'bg-gradient-to-r from-primary to-blue-400 shadow-lg shadow-primary/20') 
                      : 'bg-slate-100 border border-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
