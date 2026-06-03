import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { Loader2, Check, X, Shield, Settings2, UserPlus, Mail, Phone, Briefcase } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState("");
  const [familiaId, setFamiliaId] = useState("");
  const [childId, setChildId] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myTeamId, setMyTeamId] = useState("");
  
  // Estados Invitación
  const [invRole, setInvRole] = useState("");
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invPhone, setInvPhone] = useState("");
  const [invSpecialty, setInvSpecialty] = useState("");
  const [invCanCreateObs, setInvCanCreateObs] = useState(true);
  const [invCanEditGoals, setInvCanEditGoals] = useState(false);
  
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editPermissions, setEditPermissions] = useState({
    viewObs: true,
    createObs: true,
    viewGoals: true,
    editGoals: false
  });

  const statusColors: Record<string, string> = {
    active: "text-success bg-success/10 border-success/20",
    pending: "text-warning bg-warning/10 border-warning/20",
    activo: "text-success bg-success/10 border-success/20",
    pendiente: "text-warning bg-warning/10 border-warning/20",
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: myTeam } = await supabase
      .from("equipo_pai")
      .select("id, familia_id, persona_autismo_id, rol, personas_autismo(full_name)")
      .eq("user_id", user.id)
      .limit(1);

    if (myTeam && myTeam.length > 0) {
      setMyTeamId(myTeam[0].id);
      const fid = myTeam[0].familia_id;
      const pid = myTeam[0].persona_autismo_id;
      const role = myTeam[0].rol;
      setFamiliaId(fid);
      setChildId(pid);
      // @ts-ignore
      setChildName(myTeam[0].personas_autismo?.full_name || "Hijo/a");

      // Validar si es propietario real consultando la tabla familias
      const { data: familyInfo } = await supabase
        .from("familias")
        .select("propietario_id")
        .eq("id", fid)
        .single();
        
      const isOwner = familyInfo?.propietario_id === user.id;

      const normalizedRole = role?.toLowerCase() || "";
      setIsAdmin(isOwner || normalizedRole.includes("padre") || normalizedRole.includes("madre") || normalizedRole.includes("propietario") || normalizedRole.includes("administrador"));

      const { data: teamData } = await supabase
        .from("equipo_pai")
        .select("*")
        .eq("familia_id", fid)
        .order("created_at", { ascending: true });

      if (teamData) {
        setTeam(teamData.map(m => ({
          id: m.id,
          name: m.invite_email || "Usuario Invitado",
          role: m.rol,
          email: m.invite_email,
          phone: "", 
          status: m.invite_status || "activo",
          specialty: m.specialty,
          permissions: { 
            viewObs: m.puede_ver_observaciones, 
            createObs: m.puede_crear_observaciones, 
            viewGoals: m.puede_ver_objetivos, 
            editGoals: m.puede_editar_objetivos 
          },
        })));
      }
    }
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!invEmail || !invRole) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const inviterName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Un usuario";

      const { data, error } = await supabase
        .from("equipo_pai")
        .insert({
          familia_id: familiaId,
          persona_autismo_id: childId,
          rol: invRole,
          specialty: invSpecialty,
          invite_email: invEmail,
          invite_status: "pendiente",
          puede_ver_observaciones: true,
          puede_crear_observaciones: invCanCreateObs,
          puede_ver_objetivos: true,
          puede_editar_objetivos: invCanEditGoals,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Send email via edge function
      const { error: fnError } = await supabase.functions.invoke('send-invitation', {
        body: { email: invEmail, role: invRole, childName: childName, inviterName: inviterName }
      });

      if (fnError) {
        console.error("Error invoking send-invitation:", fnError);
        toast.error("Miembro añadido, pero hubo un error enviando el correo.");
      } else {
        toast.success(`Invitación enviada a ${invEmail}`);
      }

      setShowInvite(false);
      loadTeam();
    } catch (error: any) {
      toast.error("Error al invitar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!editingMember) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("equipo_pai")
        .update({
          puede_ver_observaciones: editPermissions.viewObs,
          puede_crear_observaciones: editPermissions.createObs,
          puede_ver_objetivos: editPermissions.viewGoals,
          puede_editar_objetivos: editPermissions.editGoals,
        })
        .eq("id", editingMember.id);

      if (error) throw error;
      
      toast.success("Permisos actualizados correctamente");
      setEditingMember(null);
      loadTeam();
    } catch (error: any) {
      toast.error("Error al actualizar permisos");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar a este miembro del equipo?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("equipo_pai")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Miembro eliminado del equipo");
      loadTeam();
    } catch (error: any) {
      toast.error("Error al eliminar miembro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto px-2 md:px-4">
        {/* Header Responsivo */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-responsive-h1 text-foreground leading-none mb-1">Mi Equipo</h1>
            <p className="text-sm md:text-base text-muted-foreground font-medium">Profesionales y familia apoyando a {childName}</p>
          </div>
          {isAdmin && (
            <Button className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-widest gap-2" onClick={() => setShowInvite(true)}>
              <UserPlus size={18} /> Invitar Miembro
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Sincronizando Equipo...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
            {team.map(m => (
              <div key={m.id} className="bg-card border-2 rounded-[32px] p-6 md:p-8 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20">
                    {m.name?.[0] || m.email?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-foreground text-lg tracking-tight truncate leading-none mb-1">{m.name || "Sin nombre"}</h3>
                    <p className={`inline-block px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${statusColors[m.status]}`}>
                      {m.status === "active" || m.status === "activo" ? "✓ Activo" : "⏳ Pendiente"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6 bg-muted/20 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Briefcase size={14} className="text-primary" />
                    <span className="font-bold text-foreground">{m.role}</span> {m.specialty && `· ${m.specialty}`}
                  </div>
                  {m.email && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground truncate">
                      <Mail size={14} className="text-primary" /> {m.email}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[
                    { label: "Ver Obs.", active: m.permissions?.viewObs },
                    { label: "Crear Obs.", active: m.permissions?.createObs },
                    { label: "Ver Metas", active: m.permissions?.viewGoals },
                    { label: "Ed. Metas", active: m.permissions?.editGoals },
                  ].map((p, i) => (
                    <div key={i} className={`flex items-center gap-1.5 p-2 rounded-xl border text-[9px] font-black uppercase tracking-tighter ${p.active ? 'bg-success/5 border-success/10 text-success' : 'bg-muted/50 border-transparent text-muted-foreground'}`}>
                      {p.active ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                      {p.label}
                    </div>
                  ))}
                </div>

                {isAdmin && m.id !== myTeamId && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-2" onClick={() => { setEditingMember(m); setEditPermissions(m.permissions); }}>
                      <Settings2 size={14} className="mr-2" /> Permisos
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-destructive border-2 border-destructive/20 hover:bg-destructive/10"
                      onClick={() => handleRemoveMember(m.id)}
                    >
                      <X size={14} className="mr-2" /> Eliminar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Invitación - Ultra Responsive */}
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
            <div className="bg-primary/5 p-6 border-b border-primary/10">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-primary uppercase tracking-tighter flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <UserPlus size={20} />
                  </div>
                  Invitar al Equipo
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-medium mt-2">Sincroniza el apoyo de {childName} con especialistas.</p>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "Padre", label: "Familia", icon: "🏠" },
                  { id: "Terapeuta", label: "Terapeuta", icon: "🧩" },
                  { id: "Médico", label: "Médico", icon: "🩺" },
                  { id: "Profesor", label: "Escuela", icon: "🏫" },
                ].map(r => (
                  <button key={r.id} onClick={() => setInvRole(r.id)} className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${invRole === r.id ? "border-primary bg-primary/5 ring-4 ring-primary/5" : "border-slate-100 hover:border-slate-200 bg-white"}`}>
                    <span className="text-2xl mb-2">{r.icon}</span>
                    <span className="font-black text-[10px] uppercase tracking-widest">{r.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Correo Electrónico</Label>
                  <Input placeholder="correo@ejemplo.com" value={invEmail} onChange={e => setInvEmail(e.target.value)} className="h-12 rounded-2xl border-2 focus-visible:ring-primary/20" />
                </div>
                {invRole && invRole !== "Padre" && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Especialidad</Label>
                    <Input placeholder="Ej: Neurólogo, Psicólogo..." value={invSpecialty} onChange={e => setInvSpecialty(e.target.value)} className="h-12 rounded-2xl border-2 focus-visible:ring-primary/20" />
                  </div>
                )}
              </div>

              <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Permisos Rápidos</p>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-tight">Registrar Notas</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Permite añadir observaciones.</p>
                  </div>
                  <Switch checked={invCanCreateObs} onCheckedChange={setInvCanCreateObs} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-tight">Editar Objetivos</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Permite proponer metas PAI.</p>
                  </div>
                  <Switch checked={invCanEditGoals} onCheckedChange={setInvCanEditGoals} />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-slate-50 flex-col sm:flex-row gap-3">
              <Button variant="ghost" className="w-full sm:flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest" onClick={() => setShowInvite(false)}>
                Cerrar
              </Button>
              <Button className="w-full sm:flex-1 h-12 rounded-xl bg-primary font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20" disabled={!invEmail || !invRole} onClick={handleInvite}>
                {loading ? <Loader2 className="animate-spin" /> : "Enviar Invitación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Gestión de Permisos */}
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[32px]">
            <div className="bg-slate-900 p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Shield size={32} />
              </div>
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-white uppercase tracking-tighter">Gestionar Permisos</DialogTitle>
                <p className="text-xs text-slate-400 font-medium mt-2">Configura el acceso para <span className="text-primary font-bold">{editingMember?.name}</span></p>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                {[
                  { id: "viewObs", label: "Ver Historial", desc: "Permite ver todas las observaciones registradas.", icon: <History size={16} />, state: editPermissions.viewObs },
                  { id: "createObs", label: "Registrar Notas", desc: "Permite añadir nuevas observaciones y audios.", icon: <MessageSquare size={16} />, state: editPermissions.createObs },
                  { id: "viewGoals", label: "Ver Objetivos PAI", desc: "Permite consultar las metas y el progreso.", icon: <Target size={16} />, state: editPermissions.viewGoals },
                  { id: "editGoals", label: "Gestionar Metas", desc: "Permite proponer y editar objetivos del plan.", icon: <Settings2 size={16} />, state: editPermissions.editGoals },
                ].map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:border-primary/20">
                    <div className="flex gap-4 items-start">
                      <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm">{p.icon}</div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-black uppercase tracking-tight text-slate-900">{p.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight max-w-[200px]">{p.desc}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={p.state} 
                      onCheckedChange={(checked) => setEditPermissions(prev => ({ ...prev, [p.id]: checked }))} 
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="p-8 bg-slate-50 flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" className="h-14 flex-1 rounded-2xl font-black text-xs uppercase tracking-widest" onClick={() => setEditingMember(null)}>
                Cancelar
              </Button>
              <Button 
                className="h-14 flex-[2] rounded-2xl bg-primary font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20"
                onClick={handleUpdatePermissions}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// Iconos adicionales para el modal
const History = ({ size, className }: { size: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);

const MessageSquare = ({ size, className }: { size: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

const Target = ({ size, className }: { size: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);
