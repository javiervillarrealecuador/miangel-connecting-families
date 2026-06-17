import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Activity, Mail, Lock, User, ShieldCheck, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const inviteId = params.get("invite_id");
    
    if (inviteId) {
      localStorage.setItem("pending_invite_id", inviteId);
    }
    
    if (email) {
      setRegEmail(email);
      setLoginEmail(email);
      setTab("register");
      toast.info("Por favor completa tu registro para unirte al equipo.");
    } else if (inviteId) {
      setTab("register");
      toast.info("Por favor completa tu registro para unirte al equipo.");
    }
  }, []);

  const canLogin = loginEmail && loginPass && !loading;
  const canRegister = regName && regEmail && regPass && regConfirm && regPass === regConfirm && accepted && !loading;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLogin) return;
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPass,
      });
      if (error) throw error;
      toast.success("¡Bienvenido de nuevo!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegister) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPass,
        options: { data: { full_name: regName } }
      });
      if (error) throw error;
      toast.success("¡Cuenta creada! Revisa tu correo electrónico.");
      navigate("/verify-email");
    } catch (error: any) {
      toast.error(error.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Por favor ingresa tu correo electrónico");
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/settings?tab=user`,
      });
      if (error) throw error;
      toast.success("Enlace de recuperación enviado. Revisa tu correo.");
      setForgotMode(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el enlace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-success/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-[24px] shadow-2xl shadow-primary/30 mb-6 group transition-transform hover:scale-110">
            <Activity className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">mIAngel</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Tecnología que Conecta Familias</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border-2 border-white rounded-[40px] shadow-2xl p-8 md:p-10">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 mb-10 bg-muted/50 p-1.5 rounded-[20px] h-14">
              <TabsTrigger value="login" className="rounded-[15px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest">Ingresar</TabsTrigger>
              <TabsTrigger value="register" className="rounded-[15px] data-[state=active]:bg-white data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest">Unirse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="outline-none">
              {!forgotMode ? (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                      <Input 
                        type="email" 
                        placeholder="tu@email.com" 
                        value={loginEmail} 
                        onChange={e => setLoginEmail(e.target.value)} 
                        className="h-14 pl-12 rounded-2xl border-2 focus-visible:ring-primary/20" 
                        disabled={loading} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setForgotMode(true);
                          setResetEmail(loginEmail);
                        }}
                        className="text-[10px] font-black uppercase text-primary hover:text-primary/70 transition-colors tracking-widest border-b border-primary/20"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={loginPass} 
                        onChange={e => setLoginPass(e.target.value)} 
                        className="h-14 pl-12 rounded-2xl border-2 focus-visible:ring-primary/20" 
                        disabled={loading} 
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-16 bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95" 
                    disabled={!canLogin}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Ingresar al Panel"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <h3 className="font-black text-lg text-slate-900 leading-none">Recuperar Clave</h3>
                    <p className="text-[10px] font-medium text-muted-foreground">Te enviaremos un enlace seguro para restablecer tu contraseña.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tu Correo Registrado</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                      <Input 
                        type="email" 
                        placeholder="tu@email.com" 
                        value={resetEmail} 
                        onChange={e => setResetEmail(e.target.value)} 
                        className="h-14 pl-12 rounded-2xl border-2 focus-visible:ring-primary/20" 
                        disabled={loading} 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button 
                      type="submit" 
                      className="w-full h-16 bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all" 
                      disabled={!resetEmail || loading}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : "Enviar Enlace de Reseteo"}
                    </Button>
                    <button 
                      type="button" 
                      onClick={() => setForgotMode(false)}
                      className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary tracking-widest"
                    >
                      Volver al Ingreso
                    </button>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="register" className="outline-none">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                    <Input 
                      placeholder="Ej: Juan Pérez" 
                      value={regName} 
                      onChange={e => setRegName(e.target.value)} 
                      className="h-14 pl-12 rounded-2xl border-2 focus-visible:ring-primary/20" 
                      disabled={loading} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                    <Input 
                      type="email" 
                      placeholder="tu@email.com" 
                      value={regEmail} 
                      onChange={e => setRegEmail(e.target.value)} 
                      className="h-14 pl-12 rounded-2xl border-2 focus-visible:ring-primary/20" 
                      disabled={loading} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Clave</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={regPass} 
                      onChange={e => setRegPass(e.target.value)} 
                      className="h-14 rounded-2xl border-2 focus-visible:ring-primary/20" 
                      disabled={loading} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirmar</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={regConfirm} 
                      onChange={e => setRegConfirm(e.target.value)} 
                      className="h-14 rounded-2xl border-2 focus-visible:ring-primary/20" 
                      disabled={loading} 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border-2 border-transparent hover:border-primary/5 transition-all">
                  <Checkbox id="terms" checked={accepted} onCheckedChange={(c) => setAccepted(!!c)} disabled={loading} />
                  <Label htmlFor="terms" className="text-[10px] font-bold text-muted-foreground uppercase leading-tight cursor-pointer">Acepto los términos de privacidad y seguridad clínica</Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-16 bg-success hover:bg-success/90 text-white shadow-2xl shadow-success/20 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95" 
                  disabled={!canRegister}
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Crear Mi Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
          <ShieldCheck size={16} />
          <p className="text-[10px] font-black uppercase tracking-widest">Encriptación de Grado Clínico Activa</p>
        </div>
      </div>
    </div>
  );
}
