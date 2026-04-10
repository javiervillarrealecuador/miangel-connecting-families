import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { currentUser } from "@/data/mockData";

export default function SettingsPage() {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [twoFactor, setTwoFactor] = useState(false);
  const [receiveAlerts, setReceiveAlerts] = useState(true);
  const [alertMethods, setAlertMethods] = useState(["app", "email"]);
  const [minSeverity, setMinSeverity] = useState([2]);
  const [quietMode, setQuietMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [aiMode, setAiMode] = useState("cloud");

  const toggleMethod = (m: string) =>
    setAlertMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Configuración</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="security">Privacidad</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="ai">IA y Datos</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div><Label>Nombre completo</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input value={currentUser.email} disabled className="bg-muted" /></div>
            <div><Label>Teléfono</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {name.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <Button className="btn-touch bg-success text-success-foreground hover:bg-success/90" onClick={() => toast.success("✓ Guardado")}>
              Guardar cambios
            </Button>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Button variant="outline" className="btn-touch">Cambiar contraseña</Button>
            <div className="flex items-center justify-between">
              <Label>Autenticación de dos factores</Label>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
            </div>
            <div>
              <Label className="mb-2 block">Sesiones activas</Label>
              {["Navegador Chrome en computadora", "Safari en iPhone"].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{s}</span>
                  <button className="text-xs text-destructive hover:underline">Desconectar</button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="btn-touch">Descargar mis datos</Button>
            <Button variant="outline" className="btn-touch text-destructive border-destructive">Eliminar cuenta</Button>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Recibir alertas</Label>
              <Switch checked={receiveAlerts} onCheckedChange={setReceiveAlerts} />
            </div>
            <div>
              <Label className="mb-2 block">Método</Label>
              {[
                { id: "app", label: "Notificación en app" },
                { id: "email", label: "Email" },
                { id: "whatsapp", label: "WhatsApp" },
              ].map(m => (
                <div key={m.id} className="flex items-center gap-2 mb-1">
                  <Checkbox id={`method-${m.id}`} checked={alertMethods.includes(m.id)} onCheckedChange={() => toggleMethod(m.id)} />
                  <Label htmlFor={`method-${m.id}`} className="text-sm">{m.label}</Label>
                </div>
              ))}
            </div>
            <div>
              <Label>Severidad mínima: {minSeverity[0]}</Label>
              <Slider value={minSeverity} onValueChange={setMinSeverity} min={1} max={5} step={1} className="mt-2" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Horario de silencio</Label>
              <Switch checked={quietMode} onCheckedChange={setQuietMode} />
            </div>
            {quietMode && (
              <div className="flex gap-3">
                <div className="flex-1"><Label>Desde</Label><Input type="time" defaultValue="22:00" /></div>
                <div className="flex-1"><Label>Hasta</Label><Input type="time" defaultValue="07:00" /></div>
              </div>
            )}
            <Button className="btn-touch bg-success text-success-foreground hover:bg-success/90" onClick={() => toast.success("✓ Guardado")}>
              Guardar
            </Button>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <h3 className="font-semibold text-foreground">Inteligencia Artificial</h3>
            <div className="flex items-center justify-between">
              <div>
                <Label>Permitir que IA analice historial</Label>
                <p className="text-xs text-muted-foreground">Mejora recomendaciones</p>
              </div>
              <Switch checked={aiAnalysis} onCheckedChange={setAiAnalysis} />
            </div>
            <div className="flex items-center justify-between opacity-50">
              <div>
                <Label>Entrenar modelo personalizado</Label>
                <p className="text-xs text-muted-foreground">Disponible próximamente</p>
              </div>
              <Switch disabled />
            </div>
            <div>
              <Label className="mb-2 block">Modo de funcionamiento</Label>
              <RadioGroup value={aiMode} onValueChange={setAiMode} className="space-y-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="cloud" id="ai-cloud" />
                  <Label htmlFor="ai-cloud" className="text-sm">Cloud API en tiempo real (recomendado)</Label>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <RadioGroupItem value="finetune" id="ai-ft" disabled />
                  <Label htmlFor="ai-ft" className="text-sm">Fine-tuning personalizado</Label>
                </div>
              </RadioGroup>
            </div>
            <button className="text-sm text-secondary hover:underline">Leer política de privacidad</button>
            <Button className="btn-touch bg-success text-success-foreground hover:bg-success/90" onClick={() => toast.success("✓ Guardado")}>
              Guardar preferencias
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
