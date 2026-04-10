import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { teamMembers as initialTeam, child } from "@/data/mockData";

export default function TeamPage() {
  const [team, setTeam] = useState(initialTeam);
  const [showInvite, setShowInvite] = useState(false);
  const [invRole, setInvRole] = useState("");
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invPhone, setInvPhone] = useState("");
  const [invSpecialty, setInvSpecialty] = useState("");

  const statusColors: Record<string, string> = {
    active: "text-success bg-success/10",
    pending: "text-warning bg-warning/10",
  };

  const handleInvite = () => {
    const newMember = {
      id: String(Date.now()),
      name: invName,
      role: invRole,
      email: invEmail,
      phone: invPhone,
      status: "pending" as const,
      since: new Date().toISOString().split("T")[0],
      specialty: invSpecialty,
      permissions: { viewObs: true, createObs: true, viewGoals: true, editGoals: false },
    };
    setTeam([...team, newMember]);
    setShowInvite(false);
    setInvRole(""); setInvName(""); setInvEmail(""); setInvPhone(""); setInvSpecialty("");
    toast.success(`Invitación enviada a ${invEmail}`);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">Mi Equipo</h1>
        <p className="text-muted-foreground text-sm mb-6">Profesionales y personas que apoyan a {child.name}</p>

        <div className="space-y-4 mb-6">
          {team.map(m => (
            <div key={m.id} className="bg-card border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{m.name}</h3>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                  <p className="text-xs text-muted-foreground mt-1">📧 {m.email}</p>
                  {m.phone && <p className="text-xs text-muted-foreground">📱 {m.phone}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[m.status]}`}>
                      {m.status === "active" ? "✅ Activo" : "⏳ Pendiente"}
                    </span>
                    {m.specialty && <span className="text-xs text-muted-foreground">· {m.specialty}</span>}
                  </div>
                  <div className="mt-2 text-xs space-y-0.5">
                    <p>{m.permissions.viewObs ? "✓" : "✗"} Ver observaciones</p>
                    <p>{m.permissions.createObs ? "✓" : "✗"} Crear observaciones</p>
                    <p>{m.permissions.viewGoals ? "✓" : "✗"} Ver objetivos</p>
                    <p>{m.permissions.editGoals ? "✓" : "✗"} Editar objetivos</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">Editar permisos</Button>
                    <Button size="sm" variant="outline" className="text-destructive">Remover</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full btn-touch" onClick={() => setShowInvite(true)}>
          + Invitar Nuevo Miembro
        </Button>

        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent>
            <DialogHeader><DialogTitle>Invitar Profesional o Familiar</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rol</Label>
                <Select value={invRole} onValueChange={setInvRole}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                  <SelectContent>
                    {["Padre", "Terapeuta", "Profesor", "Médico", "Familiar"].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nombre</Label><Input value={invName} onChange={e => setInvName(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)} /></div>
              <div><Label>Teléfono (opcional)</Label><Input value={invPhone} onChange={e => setInvPhone(e.target.value)} /></div>
              {(invRole === "Terapeuta" || invRole === "Médico") && (
                <div><Label>Especialidad</Label><Input value={invSpecialty} onChange={e => setInvSpecialty(e.target.value)} /></div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowInvite(false)}>Cancelar</Button>
                <Button className="flex-1" disabled={!invName || !invEmail || !invRole} onClick={handleInvite}>Enviar Invitación</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
