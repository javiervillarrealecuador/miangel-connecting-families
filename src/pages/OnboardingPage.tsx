import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Baby, 
  Stethoscope, 
  School, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Loader2, 
  Heart,
  Activity,
  Users
} from "lucide-react";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<any>(null);

  // Step 1: Básico
  const [childName, setChildName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [gender, setGender] = useState("");

  // Step 2: Médico
  const [diagDate, setDiagDate] = useState("");
  const [supportLevel, setSupportLevel] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);

  // Step 3: Social/Educativo
  const [attendsSchool, setAttendsSchool] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [grade, setGrade] = useState("");
  const [teacher, setTeacher] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Español"]);
  const [household, setHousehold] = useState<string[]>([]);

  useEffect(() => {
    checkInvite();
  }, []);

  const checkInvite = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data } = await supabase
          .from("equipo_pai")
          .select("*, per:personas_autismo(full_name)")
          .ilike("invite_email", user.email)
          .eq("invite_status", "pendiente")
          .maybeSingle();
        
        if (data) setPendingInvite(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No session found");

      const { error } = await supabase
        .from("equipo_pai")
        .update({ user_id: user.id, invite_status: "activo", codigo_verificado_at: new Date().toISOString() })
        .eq("id", pendingInvite.id);
      
      if (error) throw error;
      toast.success("¡Bienvenido al equipo!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Error al aceptar invitación");
    } finally {
      setLoading(false);
    }
  };

  const toggleArr = (field: any, setField: any, val: string) => {
    setField((prev: string[]) => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión activa.");

      const { data: familyData, error: familyError } = await supabase
        .from("familias")
        .insert({ propietario_id: user.id, nombre_familia: `Familia de ${childName}` })
        .select().single();

      if (familyError) throw familyError;

      const { data: childData, error: childError } = await supabase
        .from("personas_autismo")
        .insert({
          familia_id: familyData.id,
          full_name: childName,
          birth_date: birthDate || null,
          diagnosis_date: diagDate || null,
          sexo_nacimiento: sex,
          nivel_apoyo: supportLevel,
          tipo_escolaridad: attendsSchool ? "regular" : "casa"
        })
        .select().single();

      if (childError) throw childError;

      const { error: equipoError } = await supabase.from("equipo_pai").insert({
        persona_autismo_id: childData.id,
        familia_id: familyData.id,
        user_id: user.id,
        rol: gender || "Propietario",
        estado: "activo",
        puede_ver_observaciones: true,
        puede_crear_observaciones: true,
        puede_ver_objetivos: true,
        puede_editar_objetivos: true,
      });

      if (equipoError) throw equipoError;

      toast.success("¡Perfil creado con éxito!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Error al crear el perfil");
    } finally {
      setLoading(false);
    }
  };

  const renderOptionButton = (current: any, val: string, label: string, setFn: any) => (
    <button
      onClick={() => setFn(val)}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${current === val ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-white border-slate-100 hover:border-slate-200 text-muted-foreground"}`}
    >
      {label}
    </button>
  );

  if (pendingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 md:p-12 text-center animate-fade-in border-2 border-primary/5">
          <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 relative">
            <Heart size={48} className="text-primary animate-pulse" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center text-white border-4 border-white">
              <Check size={16} strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">¡Hola de nuevo!</h1>
          <p className="text-slate-600 font-medium mb-8 leading-relaxed">
            Te han invitado a formar parte del equipo de apoyo clínico de:
            <strong className="text-primary block text-2xl mt-2 font-black">"{pendingInvite.per?.full_name}"</strong>
          </p>
          
          <div className="bg-slate-50 p-6 rounded-[32px] mb-10 border-2 border-slate-100">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Tu Rol Asignado</p>
            <p className="text-xl font-black text-slate-800 capitalize tracking-tight">{pendingInvite.rol || "Colaborador"}</p>
          </div>

          <Button 
            className="w-full h-16 text-xs font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 rounded-[24px] gap-2" 
            onClick={handleAcceptInvite}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Aceptar y Empezar Ahora"}
          </Button>
          <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            mIAngel · Tecnología que Conecta Familias
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 md:p-8">
      <div className="w-full max-w-2xl bg-white rounded-[48px] shadow-2xl p-8 md:p-12 animate-fade-in border-2 border-primary/5 relative overflow-hidden">
        {/* Progress Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-50">
          <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Registro mIAngel</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Configuración del Perfil</h1>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step >= i ? "bg-primary scale-125" : "bg-slate-100"}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 text-primary">
              <Baby size={32} />
              <h2 className="text-xl font-black tracking-tight uppercase">Datos de tu hijo/a</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Completo</Label>
                <Input value={childName} onChange={e => setChildName(e.target.value)} placeholder="Ej: Lucas Villarreal" className="h-14 rounded-2xl border-2" disabled={loading} />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha de Nacimiento</Label>
                <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="h-14 rounded-2xl border-2" disabled={loading} />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sexo de Nacimiento</Label>
                <div className="flex flex-wrap gap-2">
                  {renderOptionButton(sex, "Masculino", "Hombre", setSex)}
                  {renderOptionButton(sex, "Femenino", "Mujer", setSex)}
                  {renderOptionButton(sex, "Otro", "Otro", setSex)}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tu relación con el niño/a</Label>
                <div className="flex flex-wrap gap-2">
                  {renderOptionButton(gender, "Madre", "Madre", setGender)}
                  {renderOptionButton(gender, "Padre", "Padre", setGender)}
                  {renderOptionButton(gender, "Administrador", "Administrador / Tutor", setGender)}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                disabled={!childName || !birthDate || !sex || !gender || loading} 
                onClick={() => setStep(2)}
                className="h-14 px-10 bg-primary rounded-2xl font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
              >
                Siguiente <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 text-primary">
              <Stethoscope size={32} />
              <h2 className="text-xl font-black tracking-tight uppercase">Información Médica</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha de Diagnóstico</Label>
                <Input type="date" value={diagDate} onChange={e => setDiagDate(e.target.value)} className="h-14 rounded-2xl border-2" disabled={loading} />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nivel de Apoyo Requerido</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["Nivel 1", "Nivel 2", "Nivel 3"].map(l => (
                    <button
                      key={l}
                      onClick={() => setSupportLevel(l)}
                      className={`h-14 rounded-2xl border-2 font-black text-xs transition-all ${supportLevel === l ? "bg-primary border-primary text-white shadow-lg" : "bg-white border-slate-100 text-muted-foreground"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Instrumentos Utilizados</Label>
                <div className="flex flex-wrap gap-2">
                  {["ADOS-2", "ADI-R", "CARS", "DSM-5", "Otros"].map(i => (
                    <button
                      key={i}
                      onClick={() => toggleArr(instruments, setInstruments, i)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${instruments.includes(i) ? "bg-primary/10 border-primary text-primary" : "bg-white border-slate-100 text-muted-foreground"}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" className="h-14 px-8 font-black text-xs uppercase tracking-widest" onClick={() => setStep(1)}>
                <ChevronLeft size={18} className="mr-2" /> Atrás
              </Button>
              <Button 
                disabled={!diagDate || !supportLevel || loading} 
                onClick={() => setStep(3)}
                className="h-14 px-10 bg-primary rounded-2xl font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
              >
                Siguiente <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 text-primary">
              <Users size={32} />
              <h2 className="text-xl font-black tracking-tight uppercase">Entorno y Familia</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-muted/20 rounded-[24px] border-2 border-transparent hover:border-primary/5 transition-all">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black uppercase tracking-tight">¿Asiste a la Escuela?</Label>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Educación regular o inclusiva</p>
                </div>
                <Switch checked={attendsSchool} onCheckedChange={setAttendsSchool} disabled={loading} />
              </div>

              {attendsSchool && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Nombre de la Institución" className="h-14 rounded-2xl border-2" />
                  <Input value={teacher} onChange={e => setTeacher(e.target.value)} placeholder="Nombre del Profesor/a" className="h-14 rounded-2xl border-2" />
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Personas en el Hogar</Label>
                <div className="flex flex-wrap gap-2">
                  {["Padre", "Madre", "Abuelos", "Hermanos", "Otros"].map(p => (
                    <button
                      key={p}
                      onClick={() => toggleArr(household, setHousehold, p)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${household.includes(p) ? "bg-primary/10 border-primary text-primary" : "bg-white border-slate-100 text-muted-foreground"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="ghost" className="h-16 flex-1 font-black text-xs uppercase tracking-widest rounded-2xl" onClick={() => setStep(2)}>
                Atrás
              </Button>
              <Button 
                className="h-16 flex-[2] bg-success hover:bg-success/90 text-white shadow-2xl shadow-success/30 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] gap-2" 
                onClick={handleSubmit} 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Activity size={18} />}
                {loading ? "Creando mIAngel..." : "Finalizar y Crear PAI"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
