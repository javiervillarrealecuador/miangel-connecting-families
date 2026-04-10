import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Eye, Target, Palette, Bell, Users, FileText, Settings, LogOut, Menu, X, ChevronDown,
} from "lucide-react";
import { child, currentUser, alerts } from "@/data/mockData";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Observaciones", icon: Eye, path: "/observations", badge: 3 },
  { label: "Objetivos", icon: Target, path: "/goals" },
  { label: "Actividades", icon: Palette, path: "/activities/search" },
  { label: "Alertas", icon: Bell, path: "/alerts", badge: alerts.filter(a => !a.read).length, badgeColor: "bg-critical" },
  { label: "Equipo", icon: Users, path: "/team" },
  { label: "Reportes", icon: FileText, path: "/reports" },
  { label: "Configuración", icon: Settings, path: "/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const unreadAlerts = alerts.filter(a => !a.read).length;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-primary flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-5 flex items-center justify-between">
          <Link to="/dashboard" className="text-primary-foreground font-bold text-xl tracking-tight" onClick={() => setSidebarOpen(false)}>
            mIAngel
          </Link>
          <button className="lg:hidden text-primary-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-primary-foreground text-sm font-semibold">
            {child.name[0]}
          </div>
          <div>
            <p className="text-primary-foreground text-sm font-medium">{child.name}</p>
            <p className="text-primary-foreground/60 text-xs">{child.age} años · Nivel {child.supportLevel}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-primary-foreground font-medium"
                    : "text-primary-foreground/70 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                }`}
              >
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.badgeColor || "bg-sidebar-accent"} text-primary-foreground`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-primary-foreground text-xs font-semibold">
              {currentUser.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary-foreground text-sm font-medium truncate">{currentUser.name}</p>
            </div>
            <button onClick={() => navigate("/")} className="text-primary-foreground/60 hover:text-primary-foreground">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b px-4 h-14 flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <button onClick={() => navigate("/alerts")} className="relative p-2 rounded-md hover:bg-muted">
            <Bell size={20} />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-critical text-critical-foreground text-[10px] rounded-full flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
              {currentUser.name[0]}
            </div>
            <span className="hidden sm:inline font-medium">{currentUser.name.split(" ")[0]}</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
