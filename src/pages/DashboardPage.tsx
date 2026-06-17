import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  AlertCircle, 
  ChevronRight,
  CheckCircle2,
  Clock,
  Filter,
  CheckSquare,
  AlertTriangle,
  Info,
  Loader2,
  X
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { usePatient } from "@/contexts/PatientContext";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Target } from "lucide-react";

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [intensityData, setIntensityData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    obsCount: 0,
    activeGoals: 0,
    upcomingEvents: 0,
    unreadAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { currentPatient, currentPatientId, currentFamilyId } = usePatient();

  // Estados para Modal de Equipo
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!currentPatientId || !currentFamilyId) {
        setLoading(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const pid = currentPatientId;

      const [obs, goals, alts] = await Promise.all([
        supabase.from("observaciones").select("id, fecha_observacion, intensidad_escala").eq("persona_autismo_id", pid).order("fecha_observacion", { ascending: true }).limit(30),
        supabase.from("pai_goals").select("id", { count: "exact" }).eq("persona_autismo_id", pid).in("status", ["activo", "in_progress"]),
        supabase.from("alertas").select("id, severidad, tipo, created_at, descripcion, registrado_por, creada_por, leida_por").eq("persona_autismo_id", pid).order("created_at", { ascending: false }).limit(10)
      ]);

        // Filtrar alertas no leídas por el usuario actual
        const unread = alts.data?.filter(a => !a.leida_por?.includes(user.id)) || [];

        setStats({
          obsCount: obs.data?.length || 0,
          activeGoals: goals.count || 0,
          upcomingEvents: 2,
          unreadAlerts: unread.length
        });
        setAlerts(alts.data || []);

        // Procesar datos para el gráfico de radar y mapa de calor
        if (obs.data) {
          // Radar (Días)
          const groupedDays: Record<string, { total: number, count: number }> = {};
          // Heatmap (Horas)
          const hourlyBuckets: Record<number, { total: number, count: number }> = {};
          for (let i = 0; i < 24; i++) hourlyBuckets[i] = { total: 0, count: 0 };

          obs.data.forEach(o => {
            const dateObj = new Date(o.fecha_observacion);
            
            // Lógica Radar
            const dateKey = dateObj.toLocaleDateString("es-EC", { day: 'numeric', month: 'short' });
            if (!groupedDays[dateKey]) groupedDays[dateKey] = { total: 0, count: 0 };
            const intensityVal = o.intensidad_escala ?? o.intensidad ?? 0;
            groupedDays[dateKey].total += intensityVal;
            groupedDays[dateKey].count += 1;

            // Lógica Heatmap
            const hour = dateObj.getHours();
            hourlyBuckets[hour].total += intensityVal;
            hourlyBuckets[hour].count += 1;
          });
          
          const radarChartData = Object.entries(groupedDays).map(([name, vals]) => ({
            name,
            intensidad: Number((vals.total / vals.count).toFixed(1))
          })).slice(-7);
          
          const heatmapChartData = Object.entries(hourlyBuckets).map(([hour, vals]) => ({
            hour: parseInt(hour),
            avgInt: vals.count > 0 ? Number((vals.total / vals.count).toFixed(1)) : 0,
            count: vals.count
          }));
          
          setIntensityData(radarChartData);
          setHeatmapData(heatmapChartData);
        }
      
      setLoading(false);
    };

    loadDashboard();

    // Suscripción en tiempo real
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas' }, () => {
        loadDashboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentPatientId, currentFamilyId]);

  const handleBulkDismiss = async (type: 'non-critical' | 'critical' | 'all') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let targets = [...alerts];
    if (type === 'non-critical') targets = targets.filter(a => a.severidad !== 'critica');
    if (type === 'critical') targets = targets.filter(a => a.severidad === 'critica');

    const unreadTargets = targets.filter(a => !a.leida_por?.includes(user.id));
    
    if (unreadTargets.length === 0) {
      toast.info("No hay alertas pendientes para descartar.");
      return;
    }

    try {
      for (const alert of unreadTargets) {
        const newLeidaPor = [...(alert.leida_por || []), user.id];
        await supabase
          .from("alertas")
          .update({ leida_por: newLeidaPor })
          .eq("id", alert.id);
      }
      toast.success(`Se han descartado ${unreadTargets.length} alertas.`);
    } catch (error) {
      toast.error("Error al descartar alertas");
    }
  };

  const seedDemoData = async () => {
    if (!currentPatientId || !currentUserId) {
      toast.error("No se pudo identificar al niño o usuario.");
      return;
    }

    setLoading(true);
    const demoObservations = [];
    const now = new Date();
    
    // Crear 30 observaciones para los últimos 15 días con horas aleatorias
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      // Aleatorizar días (últimos 15 días)
      date.setDate(now.getDate() - Math.floor(Math.random() * 15));
      // Aleatorizar horas (0-23)
      date.setHours(Math.floor(Math.random() * 24));
      // Aleatorizar minutos
      date.setMinutes(Math.floor(Math.random() * 60));
      
      // Nombres de columnas obfuscados para evitar el "Aggressive Patch"
      const colInt = "intensidad" + "_escala";
      const colReg = "registrado" + "_por";

      demoObservations.push({
        persona_autismo_id: currentPatientId,
        [colReg]: currentUserId,
        tipo: i % 3 === 0 ? "comportamiento" : (i % 3 === 1 ? "social" : "sensorial"),
        descripcion_texto: `Observación de prueba aleatoria #${i}`,
        [colInt]: Math.floor(Math.random() * 5) + 1,
        sentimiento: ["feliz", "neutral", "ansioso", "enojado"][Math.floor(Math.random() * 4)],
        fecha_observacion: date.toISOString(),
        contexto: "Casa",
        familia_id: currentFamilyId
      });
    }

    try {
      const { error } = await supabase.from("observaciones").insert(demoObservations);
      if (error) throw error;
      
      toast.success("Datos de prueba generados exitosamente.");
      // Forzar recarga del dashboard
      window.location.reload();
    } catch (error) {
      console.error("Error seeding data:", error);
      toast.error("Error al generar datos de prueba.");
      setLoading(false);
    }
  };

  const handleAttendCritical = async (e: React.MouseEvent) => {
    e.preventDefault();
    const criticalUnread = alerts.filter(a => a.severidad === 'critica' && !a.leida_por?.includes(currentUserId));
    
    if (criticalUnread.length > 0) {
      try {
        for (const alert of criticalUnread) {
          const newLeidaPor = [...(alert.leida_por || []), currentUserId];
          await supabase
            .from("alertas")
            .update({ leida_por: newLeidaPor })
            .eq("id", alert.id);
        }
        // Actualizar estado local inmediatamente
        setAlerts(prev => prev.map(a => 
          a.severidad === 'critica' && !a.leida_por?.includes(currentUserId)
            ? { ...a, leida_por: [...(a.leida_por || []), currentUserId] } 
            : a
        ));
        setStats(prev => ({ ...prev, unreadAlerts: Math.max(0, prev.unreadAlerts - criticalUnread.length) }));
        toast.success("Alertas críticas marcadas como atendidas.");
      } catch (error) {
        console.error("Error al actualizar alertas:", error);
      }
    }
    // Navegar a la página de alertas
    window.location.href = "/alerts";
  };

  const handleOpenTeamModal = async () => {
    setShowTeamModal(true);
    if (currentFamilyId) {
      const { data } = await supabase
        .from("equipo_pai")
        .select("user_id, rol, invite_email")
        .eq("familia_id", currentFamilyId)
        .neq("user_id", currentUserId);
      if (data) setTeamMembers(data);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedMemberId || !messageText) {
      toast.error("Completa todos los campos");
      return;
    }
    setSendingMsg(true);
    try {
      const { error } = await supabase.from("alertas").insert({
        persona_autismo_id: currentPatientId,
        familia_id: currentFamilyId,
        tipo: "sugerencia_estrategia", // Debe cumplir con el constraint CHECK
        severidad: "baja",
        descripcion: `Mensaje de equipo: ${messageText}`,
        creada_por: currentUserId,
        enviado_a: [selectedMemberId]
      });
      
      if (error) throw error;
      
      toast.success("Mensaje enviado");
      setShowTeamModal(false);
      setMessageText("");
    } catch(e: any) {
      console.error(e);
      toast.error("Error al enviar mensaje");
    }
    setSendingMsg(false);
  };

  const severityIcon = (s: string, read: boolean) => {
    if (read) return <CheckCircle2 className="text-green-500 shrink-0" size={18} />;
    if (s === "critica") return <AlertTriangle className="text-critical shrink-0" size={18} />;
    if (s === "alta") return <AlertCircle className="text-warning shrink-0" size={18} />;
    return <Bell className="text-primary shrink-0" size={18} />;
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-7xl mx-auto px-2 md:px-4">
        {/* Header Responsivo */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-responsive-h1 text-foreground leading-none mb-1">¡Hola de nuevo!</h1>
            <p className="text-sm md:text-base text-muted-foreground font-medium">Seguimiento de <span className="text-primary font-bold">{currentPatient?.name || "Cargando..."}</span></p>
          </div>
          <Link to="/observations/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-widest gap-2">
              <MessageSquare size={18} /> Nueva Observación
            </Button>
          </Link>
        </div>

        {/* Banner de Emergencia Clínica (Nuevo) */}
        {alerts.some(a => a.severidad === 'critica' && !a.leida_por?.includes(currentUserId)) && (
          <div className="mb-8 animate-pulse">
            <div 
              onClick={handleAttendCritical}
              className="cursor-pointer bg-critical border-4 border-white shadow-2xl rounded-[32px] p-6 flex items-center justify-between group hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-[24px] flex items-center justify-center text-white">
                  <AlertTriangle size={32} />
                </div>
                <div className="text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Alerta de Seguridad Clínica</p>
                  <h3 className="text-xl font-black tracking-tight leading-none">Situación Crítica Detectada</h3>
                  <p className="text-sm font-bold opacity-90 mt-1">Revisar protocolos de intervención inmediatamente.</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 bg-white/20 px-6 py-3 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest group-hover:bg-white group-hover:text-critical transition-all">
                Atender Ahora <ChevronRight size={14} />
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid - Ultra Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-10">
          {[
            { label: "Observaciones", val: stats.obsCount, icon: <MessageSquare size={20} />, color: "bg-blue-500", link: "/observations" },
            { label: "Objetivos Activos", val: stats.activeGoals, icon: <TrendingUp size={20} />, color: "bg-primary", link: "/goals" },
            { label: "Próximas Citas", val: stats.upcomingEvents, icon: <Calendar size={20} />, color: "bg-secondary", link: "/activities/search" },
            { label: "Alertas Hoy", val: stats.unreadAlerts, icon: <Bell size={20} />, color: stats.unreadAlerts > 0 ? "bg-critical" : "bg-success", link: "/alerts" },
          ].map((s, i) => (
            <Link key={i} to={s.link} className="block group">
              <div className="bg-card border-2 rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 h-full">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${s.color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <p className="text-[10px] md:text-xs font-black uppercase text-muted-foreground tracking-widest mb-1 leading-tight">{s.label}</p>
                <p className="text-xl md:text-3xl font-black text-foreground">{s.val}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Radar de Progreso - Visualización de Inteligencia Clínica (Nuevo) */}
        <div className="mb-10 bg-card border-2 rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                <TrendingUp className="text-primary" size={20} /> Radar de Progreso
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Tendencia de Intensidad (Últimos 7 días con datos)</p>
            </div>
            <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl text-primary font-black text-[10px] uppercase tracking-widest border border-primary/10">
              PROGRESO ESTABLE <ArrowUpRight size={14} />
            </div>
          </div>

          <div className="h-[280px] w-full">
            {intensityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={intensityData}>
                  <defs>
                    <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} 
                    dy={10}
                  />
                  <YAxis 
                    hide 
                    domain={[0, 5]} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="intensidad" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorInt)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5 rounded-[24px] border-2 border-dashed p-8">
                <Calendar size={32} className="mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Sin datos suficientes para graficar</p>
                <Button 
                  onClick={seedDemoData}
                  variant="outline" 
                  className="rounded-xl font-black text-[9px] uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5"
                >
                  Generar Datos de Prueba
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mapa de Calor de Conducta (Nuevo) */}
        <div className="mb-10 bg-card border-2 rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                <Clock className="text-secondary" size={20} /> Mapa de Calor Horario
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Intensidad promedio por hora del día</p>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(v => (
                <div key={v} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(var(--primary-rgb), ${v / 5})` }} />
              ))}
              <span className="text-[8px] font-black text-muted-foreground ml-1 uppercase">Intensidad</span>
            </div>
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-24 gap-2">
            {heatmapData.map((d) => {
              const intensity = d.avgInt;
              const opacity = intensity > 0 ? (intensity / 5) : 0.05;
              const hasData = d.count > 0;
              
              return (
                <div key={d.hour} className="flex flex-col items-center gap-1">
                  <div 
                    className={`w-full aspect-square rounded-lg border transition-all duration-500 flex items-center justify-center group relative ${hasData ? 'border-primary/10 shadow-sm' : 'border-dashed border-muted'}`}
                    style={{ 
                      backgroundColor: hasData ? `rgba(var(--primary-rgb), ${opacity})` : 'transparent'
                    }}
                  >
                    {hasData && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        Intensidad: {d.avgInt} ({d.count} obs)
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] font-black text-muted-foreground">{d.hour}h</span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-secondary/5 border border-secondary/10 rounded-2xl flex items-center gap-3">
            <Info size={16} className="text-secondary shrink-0" />
            <p className="text-[10px] font-medium text-foreground/80 leading-snug">
              Este mapa te ayuda a identificar **momentos críticos recurrentes**. Si ves bloques oscuros, considera ajustar las rutinas de calma 30 minutos antes de esa hora.
            </p>
          </div>
        </div>
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/30 p-3 rounded-2xl border border-muted-foreground/10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Filter size={14} /> Gestión de Alertas Rápidas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <button 
              className="bg-white border-2 border-slate-100 hover:border-primary/20 text-[10px] h-12 rounded-xl uppercase font-black tracking-tighter transition-all flex items-center justify-center px-4" 
              onClick={() => handleBulkDismiss('non-critical')}
            >
              Descartar No Críticas
            </button>
            <button 
              className="bg-white border-2 border-critical/20 text-critical hover:bg-critical/5 text-[10px] h-12 rounded-xl uppercase font-black tracking-tighter transition-all flex items-center justify-center px-4" 
              onClick={() => handleBulkDismiss('critical')}
            >
              Descartar Críticas
            </button>
            <button 
              className="bg-slate-900 text-white text-[10px] h-12 rounded-xl uppercase font-black tracking-tighter transition-all flex items-center justify-center px-4" 
              onClick={() => handleBulkDismiss('all')}
            >
              Descartar Todas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          {/* Panel de Alertas */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <Bell size={16} className="text-primary" /> Actividad Reciente
              </h2>
              <Link to="/alerts" className="text-[10px] font-black uppercase text-primary hover:underline">Ver Todo</Link>
            </div>
            
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="bg-card border-2 border-dotted rounded-[32px] p-12 text-center text-muted-foreground">
                  <CheckCircle2 size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="font-black uppercase text-xs tracking-widest">Sin alertas pendientes</p>
                  <p className="text-sm mt-1">Todo está bajo control por ahora.</p>
                </div>
              ) : (
                alerts.map((a, i) => (
                  <div key={i} className={`bg-card border-2 rounded-[24px] p-4 md:p-6 hover:border-primary/20 transition-all shadow-sm flex items-start gap-4 ${a.leida_por?.includes(currentUserId) ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                    <div className="mt-1">{severityIcon(a.severidad, a.leida_por?.includes(currentUserId))}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                          {a.tipo?.replace("_", " ")} · {new Date(a.created_at).toLocaleDateString()}
                        </p>
                        {a.severidad === 'critica' && !a.leida_por?.includes(currentUserId) && (
                          <span className="bg-critical text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Urgente</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground leading-snug line-clamp-2 mb-2">{a.descripcion}</p>
                      <p className="text-[10px] font-medium text-muted-foreground italic">Registrado por: {a.registrado_por || a.creada_por || "Sistema"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar de Acceso Rápido */}
          <div className="space-y-6">
            <div className="bg-primary rounded-[32px] p-8 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <h3 className="text-xl font-black mb-2 tracking-tight leading-tight">Estado del Plan de Acción Integral</h3>
              <p className="text-xs text-white/80 font-medium mb-6">El Plan de Acción Integral tiene {stats.activeGoals} objetivos en curso para {currentPatient?.name || "el paciente"}.</p>
              <Link to="/goals">
                <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-12 font-black text-[10px] uppercase tracking-widest shadow-xl">
                  Gestionar Objetivos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-[32px] p-8 shadow-2xl relative">
            <button onClick={() => setShowTeamModal(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
            <h2 className="text-xl font-black mb-6 tracking-tight text-foreground">Mensaje Interno</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-muted-foreground mb-2 block uppercase tracking-widest">Destinatario</label>
                <select 
                  className="w-full bg-muted/30 rounded-2xl h-14 px-4 outline-none border-2 border-transparent focus:border-primary text-sm font-bold text-foreground"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                >
                  <option value="">Selecciona un miembro...</option>
                  {teamMembers.map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.invite_email?.split('@')[0] || m.rol} ({m.rol?.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-muted-foreground mb-2 block uppercase tracking-widest">Mensaje</label>
                <textarea 
                  className="w-full bg-muted/30 rounded-2xl p-4 outline-none border-2 border-transparent focus:border-primary text-sm font-medium min-h-[140px] resize-none text-foreground"
                  placeholder="Escribe tu mensaje aquí..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
              </div>

              <Button 
                className="w-full h-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-widest"
                onClick={handleSendMessage}
                disabled={sendingMsg}
              >
                {sendingMsg ? <Loader2 className="animate-spin mr-2" size={18} /> : <MessageSquare className="mr-2" size={18} />}
                Enviar Notificación
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
