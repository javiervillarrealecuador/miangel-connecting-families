import React from "react";
import { 
  Calendar, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  TrendingUp, 
  MessageSquare, 
  History, 
  ArrowRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  User, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GoalCardProps {
  goal: any;
  obsCount: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  evidences: any[];
  teamNames: Record<string, string>;
  userRole: string;
  isSubmitting: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onReactivate: (goal: any) => void;
  onEdit: (goal: any) => void;
  onDelete: (goal: any) => void;
}

export default function GoalCard({
  goal,
  obsCount,
  isExpanded,
  onToggleExpand,
  evidences,
  teamNames,
  userRole,
  isSubmitting,
  onApprove,
  onReject,
  onReactivate,
  onEdit,
  onDelete
}: GoalCardProps) {
  return (
    <div className={`bg-white border-2 rounded-[48px] p-6 md:p-12 shadow-sm transition-all overflow-hidden ${goal.status === 'completed' ? 'border-success/20 bg-success/5' : 'border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-slate-200/50'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-5">
            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${
              goal.status === 'completed' ? "bg-success text-white shadow-lg shadow-success/20" : 
              goal.status === 'pending_approval' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" :
              "bg-primary text-white shadow-lg shadow-primary/20"
            }`}>
              {goal.status === 'completed' ? '✓ Completado' : 
               goal.status === 'pending_approval' ? '⏳ Pendiente de Aprobación' :
               '⚡ En Proceso'}
            </span>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              <Calendar size={14} className="text-slate-300" /> {new Date(goal.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-4 uppercase">{goal.title}</h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-10 h-10 rounded-full p-0 hover:bg-slate-100 transition-colors">
                  <MoreVertical size={20} className="text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 bg-white border-2 border-slate-100 shadow-2xl">
                <DropdownMenuItem 
                  onClick={() => onEdit(goal)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-primary/5 text-slate-700 hover:text-primary transition-colors"
                >
                  <Pencil size={16} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Editar Meta</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(goal)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-critical/5 text-critical transition-colors"
                >
                  <Trash2 size={16} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Eliminar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">{goal.description}</p>
        </div>
        
        {goal.status === 'pending_approval' && (userRole?.toLowerCase() === 'madre' || userRole?.toLowerCase() === 'padre') && (
          <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
            <Button 
              className="flex-1 md:flex-none h-14 px-6 rounded-2xl bg-success hover:bg-success/90 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-success/20 gap-2"
              onClick={() => onApprove(goal.id)}
              disabled={isSubmitting}
            >
              <CheckCircle2 size={18} /> Aprobar
            </Button>
            <Button 
              variant="outline"
              className="flex-1 md:flex-none h-14 px-6 rounded-2xl border-2 border-critical/20 text-critical hover:bg-critical/5 font-black text-[10px] uppercase tracking-widest gap-2"
              onClick={() => onReject(goal.id)}
              disabled={isSubmitting}
            >
              <Trash2 size={18} /> Rechazar
            </Button>
          </div>
        )}

        {goal.status === 'completed' && (
          <Button 
            variant="outline" 
            className="w-full md:w-auto border-2 border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest h-14 px-8 rounded-2xl bg-white hover:bg-primary/5 shadow-sm transition-all"
            onClick={() => onReactivate(goal)}
          >
            <RotateCcw size={16} className="mr-2" /> Reactivar Meta
          </Button>
        )}
      </div>

      {goal.status === 'pending_approval' && (
        <div className="bg-amber-50 border-2 border-amber-100 p-6 md:p-8 rounded-[32px] mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
            <AlertTriangle size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="font-black text-amber-900 text-sm uppercase tracking-tight mb-1">Meta propuesta por el especialista</p>
            <p className="text-xs text-amber-700 font-medium">Esta meta fue sugerida por {teamNames[goal.propuesto_por] || "un terapeuta"}. Los padres deben aprobarla para que se active el seguimiento del progreso.</p>
          </div>
        </div>
      )}

      {/* Barra de Progreso Premium */}
      <div className="space-y-6 bg-[#f8fafc] p-8 md:p-10 rounded-[40px] border-2 border-slate-50 shadow-inner mb-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Progreso de la Meta
            </span>
            <p className="text-xs font-bold text-slate-300">Basado en evidencias clínicas</p>
          </div>
          <span className="font-black text-primary text-4xl tracking-tighter">{goal.progress}%</span>
        </div>
        <div className="relative h-5 md:h-6 bg-slate-200 rounded-full overflow-hidden border border-slate-100 shadow-inner">
          <div 
            className="absolute inset-y-0 left-0 bg-primary shadow-lg shadow-primary/20 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${goal.progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-8 pt-2">
          <div className="flex items-center gap-3 text-[11px] font-black uppercase text-slate-500 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/10">
              <MessageSquare size={18} />
            </div>
            {obsCount} Evidencias Vinculadas
          </div>
          <div className="flex items-center gap-3 text-[11px] font-black uppercase text-slate-500 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
              <History size={18} />
            </div>
            Último avance: {new Date(goal.updated_at || goal.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Sección de Evidencias Rediseñada como Timeline Profesional Plano */}
      <div className="border-t border-slate-50 pt-8">
        <Button 
          variant="ghost" 
          onClick={() => onToggleExpand(goal.id)}
          className="w-full flex justify-between items-center group h-14 rounded-3xl hover:bg-slate-50 px-6 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? "bg-primary text-white" : "bg-primary/5 text-primary"}`}>
              <History size={20} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
              {isExpanded ? "Ocultar Historial Clínico" : `Ver ${obsCount} Evidencias Clínicas`}
            </span>
          </div>
          <ArrowRight size={20} className={`text-primary/30 group-hover:text-primary transition-all duration-300 ${isExpanded ? "rotate-90" : ""}`} />
        </Button>

        {isExpanded && (
          <div className="mt-12 space-y-0 relative pl-8 md:pl-12">
            {/* Línea del Timeline */}
            <div className="absolute left-[15px] md:left-[19px] top-4 bottom-4 w-1 bg-gradient-to-b from-primary/20 via-slate-100 to-transparent rounded-full" />
            
            {evidences.length > 0 ? (
              <div className="space-y-10">
                {evidences.map((obs, idx) => {
                  const rawImpact = obs.puntaje ?? obs.impacto_porcentaje ?? obs.impact_percentage ?? obs.impacto ?? 0;
                  const impactVal = typeof rawImpact === 'string' ? parseInt(rawImpact) : Number(rawImpact);
                  
                  const authorId = obs.registrado_por || obs.observation_data?.registrado_por;
                  const authorName = authorId ? teamNames[authorId] : null;
                  const displayAuthor = authorName ? `${authorName} (${obs.rol_registrador || "Especialista"})` : (obs.rol_registrador || "Especialista");

                  const isReactivation = obs?.observacion?.includes("[REACTIVACIÓN]");
                  
                  const rawObsData = obs.observation_data;
                  const detail = Array.isArray(rawObsData) ? rawObsData[0] : rawObsData;
                  
                  return (
                    <div key={obs.id || idx} className="relative group/item">
                      {/* Punto del Timeline */}
                      <div className={`absolute -left-[23px] md:-left-[27px] top-2.5 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover/item:scale-125 ${impactVal > 0 ? "bg-success" : impactVal < 0 ? "bg-critical" : "bg-slate-300"}`} />
                      
                      {/* Contenedor Plano (Aplanado para producción según el manual) */}
                      <div className="pl-4 py-2 border-l-2 border-slate-100 hover:border-primary/40 transition-colors flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                              {obs.created_at ? new Date(obs.created_at).toLocaleDateString("es-EC", { day: 'numeric', month: 'short', year: 'numeric' }) : 'Fecha pendiente'}
                            </span>
                            <span className="inline-block text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">
                              {displayAuthor}
                            </span>
                            {isReactivation && (
                              <span className="inline-block text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-widest">
                                Ajuste de PAI
                              </span>
                            )}
                          </div>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-black text-[9px] uppercase tracking-tighter cursor-help transition-all hover:scale-105 ${
                                impactVal > 0 ? "bg-success/5 border-success/20 text-success" : 
                                impactVal < 0 ? "bg-critical/5 border-critical/20 text-critical" : 
                                "bg-slate-50 border-slate-100 text-slate-400"
                              }`}>
                                {impactVal > 0 ? <ArrowUpRight size={12} /> : impactVal < 0 ? <ArrowDownRight size={12} /> : <Activity size={12} />}
                                Impacto {impactVal}%
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[320px] p-5 bg-slate-900 text-white rounded-[28px] border-none shadow-2xl z-[100]">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-primary/20 rounded-lg">
                                    <TrendingUp size={14} className="text-primary" />
                                  </div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Análisis de Impacto PAI</p>
                                </div>
                                <p className="text-xs leading-relaxed font-medium">
                                  Esta observación de <span className="text-primary font-bold">{obs.tipo || 'comportamiento'}</span> (Intensidad: {obs.intensidad_escala || detail?.intensidad_escala || 'N/A'}/5) genera un impacto neto de <span className={impactVal >= 0 ? "text-success font-bold" : "text-critical font-bold"}>{impactVal}%</span> sobre el progreso de esta meta específica.
                                </p>
                                <div className="pt-2 border-t border-white/10">
                                  <p className="text-[9px] text-slate-400 italic">Valor determinado por el especialista basándose en la relevancia clínica del evento.</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
    
                        <div className="relative">
                          <div className="space-y-2 pl-3 border-l-2 border-slate-200">
                            <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                              "{obs.observacion || detail?.descripcion_texto || "Sin descripción detallada."}"
                            </p>
                            {detail?.contexto && (
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Contexto: {detail.contexto}
                              </p>
                            )}
                          </div>
                        </div>
    
                        {(obs.sentimiento || detail?.sentimiento) && (
                          <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 w-fit px-2.5 py-1 rounded-lg border border-slate-100">
                            Estado Emocional: <span className="text-slate-900">{obs.sentimiento || detail?.sentimiento}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center bg-slate-50/50 rounded-[48px] border-4 border-slate-50 border-dotted mr-4">
                <Activity size={48} className="mx-auto mb-6 text-slate-200" />
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Historial clínico vacío</h4>
                <p className="text-xs mt-3 text-slate-300 font-medium max-w-xs mx-auto">Las evidencias de avances aparecerán aquí conforme el equipo registre nuevas observaciones diarias.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
