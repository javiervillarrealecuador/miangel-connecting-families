import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [remember, setRemember] = useState(false);

  const canLogin = loginEmail && loginPass;
  const canRegister = regName && regEmail && regPass && regConfirm && regPass === regConfirm && accepted;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">mIAngel</h1>
          <p className="text-foreground font-semibold">Bienvenido a mIAngel</p>
          <p className="text-muted-foreground text-sm mt-1">Sincroniza la intervención de tu hijo</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Ingresar</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="tu@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="login-pass">Contraseña</Label>
              <Input id="login-pass" type="password" placeholder="••••••••" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={remember} onCheckedChange={(c) => setRemember(!!c)} />
                <Label htmlFor="remember" className="text-sm">Recuérdame</Label>
              </div>
              <button className="text-sm text-secondary hover:underline">¿Olvidaste contraseña?</button>
            </div>
            <Button className="w-full btn-touch" disabled={!canLogin} onClick={() => navigate("/dashboard")}>
              Ingresar
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <button className="text-secondary hover:underline" onClick={() => setTab("register")}>Regístrate</button>
            </p>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <div>
              <Label htmlFor="reg-name">Nombre completo</Label>
              <Input id="reg-name" placeholder="Juan García" value={regName} onChange={e => setRegName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" placeholder="tu@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="reg-pass">Contraseña</Label>
              <Input id="reg-pass" type="password" placeholder="••••••••" value={regPass} onChange={e => setRegPass(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="reg-confirm">Confirmar contraseña</Label>
              <Input id="reg-confirm" type="password" placeholder="••••••••" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} />
              {regConfirm && regPass !== regConfirm && (
                <p className="text-xs text-destructive mt-1">Las contraseñas no coinciden</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="terms" checked={accepted} onCheckedChange={(c) => setAccepted(!!c)} />
              <Label htmlFor="terms" className="text-sm">Acepto términos de privacidad</Label>
            </div>
            <Button className="w-full btn-touch" disabled={!canRegister} onClick={() => navigate("/verify-email")}>
              Crear Cuenta
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <button className="text-secondary hover:underline" onClick={() => setTab("login")}>Inicia sesión</button>
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
