import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Eye, Target, Palette, Bell, Users, FileText, Settings, LogOut, Menu, X, Shield, Activity
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Observaciones", icon: Eye, path: "/observations" },
  { label: "Objetivos PAI", icon: Target, path: "/goals" },
  { label: "Actividades", icon: Palette, path: "/activities/search" },
  { label: "Equipo", icon: Users, path: "/team" },
  { label: "Reportes", icon: FileText, path: "/reports" },
  { label: "Ajustes", icon: Settings, path: "/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Usuario");
  const [childData, setChildData] = useState({ name: "Cargando...", age: "?" });
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "Usuario");

      const { data: teamData } = await supabase
        .from("equipo_pai")
        .select("persona_autismo_id, familia_id")
        .eq("user_id", user.id)
        .limit(1);

      if (teamData && teamData.length > 0 && teamData[0].persona_autismo_id) {
        const { data: cData } = await supabase
          .from("personas_autismo")
          .select("full_name, birth_date")
          .eq("id", teamData[0].persona_autismo_id)
          .single();

        if (cData) {
          let age: string | number = "?";
          if (cData.birth_date) {
            const birth = new Date(cData.birth_date);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
              calculatedAge--;
            }
            age = calculatedAge;
          }
          setChildData({ name: cData.full_name, age: age.toString() });
        }

        // Cargar alertas no leídas
        const { count } = await supabase
          .from("alertas")
          .select("*", { count: 'exact', head: true })
          .eq("familia_id", teamData[0].familia_id)
          .eq("leida", false);
        
        setUnreadAlerts(count || 0);
      } else {
        setChildData({ name: "SIN PERFIL", age: "-" });
      }
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada correctamente");
    navigate("/");
  };

  return (
    <div className="min-h-[100dvh] flex bg-[#f8fafc]">
      {/* Mobile Overlay con Blur */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Premium */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-[100dvh] w-72 bg-primary flex flex-col transition-all duration-500 ease-in-out shadow-2xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Logo & Close */}
        <div className="p-8 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="text-white" size={24} />
            </div>
            <span className="text-white font-black text-2xl tracking-tighter">mIAngel</span>
          </Link>
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {/* Child Profile Card */}
        <div className="px-6 mb-8">
          {childData.name === "SIN PERFIL" ? (
            <Link to="/onboarding/create-child" onClick={() => setSidebarOpen(false)} className="block bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md rounded-[24px] p-5 border border-white/10 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-lg border border-white/20 shadow-inner">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm truncate uppercase tracking-tight">SIN PERFIL</p>
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-0.5">Ingresa el perfil del Autista</p>
                </div>
              </div>
            </Link>
          ) : (
            <Link to="/settings?tab=child" onClick={() => setSidebarOpen(false)} className="block bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md rounded-[24px] p-5 border border-white/10 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-lg border border-white/20 shadow-inner">
                  {childData.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm truncate uppercase tracking-tight">{childData.name}</p>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{childData.age} años · PAI ACTIVO</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-3 overflow-y-auto py-4 min-h-0">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
               <Link
                 key={item.path}
                 to={item.path}
                 onClick={() => setSidebarOpen(false)}
                 className={`flex items-center gap-4 px-6 h-14 rounded-[20px] transition-all duration-400 group relative ${
                   active
                     ? "bg-white text-primary shadow-2xl shadow-black/20 scale-[1.02]"
                     : "text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1"
                 }`}
               >
                 <item.icon size={22} className={active ? "text-primary" : "text-white/40 group-hover:text-white transition-colors"} />
                 <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
                   {item.label}
                 </span>
                 {active && (
                   <div className="absolute right-4 w-1.5 h-1.5 bg-primary rounded-full" />
                 )}
               </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-6 mt-auto border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-xs font-black border border-white/20 shadow-inner">
              {userName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[10px] font-black uppercase tracking-widest truncate">{userName}</p>
              <button onClick={handleLogout} className="text-white/40 hover:text-white text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5 mt-1 transition-colors">
                <LogOut size={12} /> Salir del Sistema
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header Responsive */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-2xl border-b border-slate-100 h-20 md:h-24 px-6 md:px-10 flex items-center gap-6">
          <button 
            className="lg:hidden w-12 h-12 flex items-center justify-center bg-primary/10 rounded-2xl text-primary shadow-sm active:scale-90 transition-transform" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={26} />
          </button>
          
          <div className="flex-1 lg:pl-4">
            <p className="hidden lg:block text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Panel de Control</p>
            <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tighter truncate">
              {location.pathname === "/dashboard" ? `Hola de nuevo, ${userName.split(" ")[0]}! 👋` : 
               navItems.find(i => location.pathname.startsWith(i.path))?.label || "Sección Activa"}
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => navigate("/alerts")} 
              className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-primary/10 text-slate-600 hover:text-primary border-2 border-slate-100 transition-all group"
            >
              <Bell size={22} className="group-hover:rotate-12 transition-transform" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-critical text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                  {unreadAlerts}
                </span>
              )}
            </button>
            
            <div 
              onClick={() => navigate("/settings")}
              className="flex items-center gap-4 p-2 md:p-2.5 rounded-2xl bg-white border-2 border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-slate-200/40 cursor-pointer transition-all group"
            >
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-primary flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                {userName[0]}
              </div>
              <div className="hidden sm:flex flex-col pr-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Mi Cuenta</span>
                <span className="text-xs font-black text-slate-900 tracking-tight">{userName.split(" ")[0]}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Body Content with optimized padding for all screens */}
        <main className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden bg-[#f8fafc]/50">
          <div className="p-6 md:p-10 lg:p-16 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
