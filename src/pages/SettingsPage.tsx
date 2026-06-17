import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { usePatient } from "@/contexts/PatientContext";
import { 
  User, Baby, Bell, ShieldCheck, Save, Activity, Heart, Brain, School, Users, Dna, Loader2, ChevronRight, Dog, BookOpen, Star, Sparkles, MessageSquare, Lock
} from "lucide-react";

export default function SettingsPage() {
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [childId, setChildId] = useState("");
  const [teamId, setTeamId] = useState("");
  
  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [childData, setChildData] = useState({
    full_name: "",
    birth_date: "",
    diagnosis_date: "",
    sexo_nacimiento: "",
    identidad_genero: "",
    nacionalidad: "",
    ciudad_provincia: "",
    idiomas_casa: [] as string[],
    nombre_madre: "",
    telefono_madre: "",
    nombre_padre: "",
    telefono_padre: "",
    tipo_escolaridad: "",
    anio_escolar: "",
    nombre_establecimiento: "",
    nombre_profesor: "",
    telefono_profesor: "",
    profesor_sombra: false,
    diagnostico_tea: true,
    nivel_apoyo: "",
    edad_primera_palabra: "",
    edad_caminar: "",
    regresion: false,
    edad_regresion: "",
    detalle_regresion: "",
    comorbilidades: [] as string[],
    materias_interes: [] as string[],
    habilidades_sociales: [] as string[],
    habilidades_comunicativas: [] as string[],
    conductas_desafiantes: [] as string[],
    emociones_reconocidas: [] as string[],
    sensorial_auditiva: 1,
    sensorial_visual: 1,
    sensorial_tactil: 1,
    sensorial_gusto_olfato: 1,
    sensorial_propioceptiva: 1,
    sensorial_vestibular: 1,
    motor_fina: 1,
    motor_gruesa: 1,
    motor_coordinacion: 1,
    motor_equilibrio: 1,
    motor_pinza: 1,
    motor_escritura: 1,
    motor_utensilios: 1,
    autonomia_vestido: 1,
    autonomia_alimentacion: 1,
    autonomia_higiene: 1,
    autonomia_sueno: 1,
    adaptativa_transiciones: 1,
    adaptativa_rutinas: 1,
    practica_deporte: false,
    deportes_practicados: "",
    terapia_aba: false,
    terapia_cognitiva: false,
    terapia_lenguaje: false,
    terapia_ocupacional: false,
    terapia_sociales: false,
    fortalezas_intereses: "",
    fortalezas_refuerzos: "",
    fortalezas_actividades: "",
    fortalezas_talentos: "",
    areas_competencia: [] as string[],
    circulo_interaccion: [] as string[],
    interaccion_animales: [] as string[],
    interaccion_animales_otro: "",
    problemas_academicos: [] as string[],
    lenguaje_expresivo: "",
    lenguaje_receptivo: "",
    dificultades_comunicacion: [] as string[],
    habilidades_socioemocionales: [] as string[],
    sistemas_comunicacion: "",
    cd_autoagresion: 1,
    cd_berrinches: 1,
    cd_fuga: 1,
    cd_destruccion: 1,
  });

  const [activeTab, setActiveTab] = useState("child");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [receiveAlerts, setReceiveAlerts] = useState(true);
  const [alertMethods, setAlertMethods] = useState(["app", "email"]);
  const [minSeverity, setMinSeverity] = useState([2]);
  const { currentPatientId } = usePatient();

  useEffect(() => {
    if (currentPatientId) {
      loadProfile();
    }
  }, [currentPatientId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "user" || tabParam === "alerts") {
      setActiveTab(tabParam);
      if (tabParam === "user") {
        toast.info("Por favor, establece tu nueva contraseña aquí.");
      }
    } else {
      setActiveTab("child");
    }
  }, [location.search]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserName(user.user_metadata?.full_name || "");
    setUserEmail(user.email || "");

    const { data: teamData } = await supabase
      .from("equipo_pai")
      .select("id, persona_autismo_id, recibir_alertas, metodos_alerta, sensibilidad_minima")
      .eq("user_id", user.id)
      .eq("persona_autismo_id", currentPatientId)
      .maybeSingle();

    if (teamData) {
      setTeamId(teamData.id);
      if (teamData.recibir_alertas !== null) setReceiveAlerts(teamData.recibir_alertas);
      if (teamData.metodos_alerta) setAlertMethods(teamData.metodos_alerta);
      if (teamData.sensibilidad_minima !== null) setMinSeverity([teamData.sensibilidad_minima]);

      if (teamData.persona_autismo_id) {
        const pId = teamData.persona_autismo_id;
        const { data: cData } = await supabase
        .from("personas_autismo")
        .select(`
          id, familia_id, full_name, birth_date, diagnosis_date, sexo_nacimiento, identidad_genero,
          nacionalidad, ciudad_provincia, idiomas_casa, nombre_madre, telefono_madre, nombre_padre, telefono_padre,
          tipo_escolaridad, anio_escolar, nombre_establecimiento, nombre_profesor, telefono_profesor, profesor_sombra,
          diagnostico_tea, nivel_apoyo, edad_primera_palabra, edad_caminar, regresion, edad_regresion, detalle_regresion,
          comorbilidades, materias_interes, habilidades_sociales, habilidades_comunicativas, conductas_desafiantes,
          emociones_reconocidas, sensorial_auditiva, sensorial_visual, sensorial_tactil, sensorial_gusto_olfato,
          sensorial_propioceptiva, sensorial_vestibular, motor_fina, motor_gruesa, motor_coordinacion, motor_equilibrio,
          motor_pinza, motor_escritura, motor_utensilios, autonomia_vestido, autonomia_alimentacion, autonomia_higiene,
          autonomia_sueno, adaptativa_transiciones, adaptativa_rutinas, practica_deporte, deportes_practicados,
          terapia_aba, terapia_cognitiva, terapia_lenguaje, terapia_ocupacional, terapia_sociales, fortalezas_intereses,
          fortalezas_refuerzos, fortalezas_actividades, fortalezas_talentos, areas_competencia, circulo_interaccion,
          interaccion_animales, interaccion_animales_otro, problemas_academicos, lenguaje_expresivo, lenguaje_receptivo,
          dificultades_comunicacion, habilidades_socioemocionales, sistemas_comunicacion, cd_autoagresion, cd_berrinches,
          cd_fuga, cd_destruccion
        `)
        .eq("id", pId)
        .single();

      if (cData) {
        setChildId(cData.id);
        setChildData(prev => ({
          ...prev,
          ...cData,
          idiomas_casa: Array.isArray(cData.idiomas_casa) ? cData.idiomas_casa : [],
          comorbilidades: Array.isArray(cData.comorbilidades) ? cData.comorbilidades : [],
          materias_interes: Array.isArray(cData.materias_interes) ? cData.materias_interes : [],
          habilidades_sociales: Array.isArray(cData.habilidades_sociales) ? cData.habilidades_sociales : [],
          habilidades_comunicativas: Array.isArray(cData.habilidades_comunicativas) ? cData.habilidades_comunicativas : [],
          conductas_desafiantes: Array.isArray(cData.conductas_desafiantes) ? cData.conductas_desafiantes : [],
          emociones_reconocidas: Array.isArray(cData.emociones_reconocidas) ? cData.emociones_reconocidas : [],
          areas_competencia: Array.isArray(cData.areas_competencia) ? cData.areas_competencia : [],
          circulo_interaccion: Array.isArray(cData.circulo_interaccion) ? cData.circulo_interaccion : [],
          problemas_academicos: Array.isArray(cData.problemas_academicos) ? cData.problemas_academicos : [],
          dificultades_comunicacion: Array.isArray(cData.dificultades_comunicacion) ? cData.dificultades_comunicacion : [],
          habilidades_socioemocionales: Array.isArray(cData.habilidades_socioemocionales) ? cData.habilidades_socioemocionales : [],
          interaccion_animales: typeof cData.interaccion_animales === "string" && cData.interaccion_animales
            ? cData.interaccion_animales.split(",").map((s: string) => s.trim()).filter(Boolean)
            : (Array.isArray(cData.interaccion_animales) ? cData.interaccion_animales : []),
        }));
      }
      }
    }
    setLoading(false);
  };

  const handleSaveAlerts = async () => {
    if (!teamId) {
      toast.error("Error: No se encontró el registro del equipo.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("equipo_pai")
      .update({
        recibir_alertas: receiveAlerts,
        metodos_alerta: alertMethods,
        sensibilidad_minima: minSeverity[0]
      })
      .eq("id", teamId);
      
    if (error) {
      toast.error(`Error al guardar: ${error.message}`);
    } else {
      toast.success("¡Configuración de alertas guardada con éxito!");
    }
    setSaving(false);
  };

  const handleSaveChild = async () => {
    if (!childId) return;
    setSaving(true);
    
    // Normalizar datos para SQL
    const payload = {
      ...childData,
      interaccion_animales: Array.isArray(childData.interaccion_animales) ? childData.interaccion_animales.join(",") : childData.interaccion_animales,
    };

    const { error } = await supabase
      .from("personas_autismo")
      .update(payload)
      .eq("id", childId);
      
    if (error) {
      toast.error(`Error al guardar: ${error.message}`);
    } else {
      toast.success("¡Perfil Integral mIAngel actualizado!");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden o están vacías");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setChangingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.success("¡Contraseña actualizada correctamente!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPass(false);
  };

  const updateChildField = (field: string, value: any) => {
    setChildData(prev => ({ ...prev, [field]: value }));
  };

  const toggleChildArrayField = (field: string, item: string) => {
    setChildData(prev => {
      const current = (prev as any)[field] as string[] || [];
      const next = current.includes(item) 
        ? current.filter(x => x !== item) 
        : [...current, item];
      return { ...prev, [field]: next };
    });
  };

  const renderMultiSelect = (field: keyof typeof childData, options: string[], label: string) => (
    <div className="space-y-3">
      {label && <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</Label>}
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = Array.isArray(childData[field]) && (childData[field] as string[]).includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleChildArrayField(field as string, option)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                isSelected 
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" 
                  : "bg-white border-slate-100 hover:border-slate-200 text-muted-foreground"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderScale = (field: keyof typeof childData, label: string) => {
    const value = (childData as any)[field] || 1;
    const colors = ["bg-success", "bg-success/80", "bg-warning", "bg-orange-500", "bg-critical"];
    const textColors = ["text-success", "text-success", "text-warning", "text-orange-500", "text-critical"];
    
    return (
      <div className="p-4 bg-muted/20 rounded-[20px] border border-transparent hover:border-primary/5 transition-all space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-[11px] font-black uppercase tracking-tight">{label}</Label>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border-2 ${textColors[value-1]} bg-white`}>
            NIVEL {value}
          </span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              onClick={() => updateChildField(field as string, i)}
              className={`h-2.5 flex-1 rounded-full transition-all ${i <= value ? colors[value-1] : "bg-muted"}`}
            />
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Recuperando Perfil Clínico Completo...</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-5xl mx-auto px-2 md:px-4 pb-32">
        <div className="mb-8">
          <h1 className="text-responsive-h1 text-foreground leading-none mb-2">Configuración Integral</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Gestión del Perfil PAI y Preferencias</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-10 bg-muted/50 p-1.5 rounded-[24px] h-16 md:h-20">
            <TabsTrigger value="child" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-xl text-[10px] md:text-xs font-black uppercase tracking-widest gap-2">
              <Baby size={16} className="hidden sm:block" /> Perfil PAI
            </TabsTrigger>
            <TabsTrigger value="user" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-xl text-[10px] md:text-xs font-black uppercase tracking-widest gap-2">
              <User size={16} className="hidden sm:block" /> Mi Cuenta
            </TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-xl text-[10px] md:text-xs font-black uppercase tracking-widest gap-2">
              <Bell size={16} className="hidden sm:block" /> Alertas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="child" className="space-y-6 outline-none">
            <Accordion type="single" collapsible className="space-y-4">
              
              {/* 1. INFORMACIÓN VITAL */}
              <AccordionItem value="info" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><Dna size={20} /> Información Vital</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Completo del Niño</Label>
                      <Input value={childData.full_name} onChange={e => updateChildField("full_name", e.target.value)} className="h-12 rounded-2xl border-2" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha de Nacimiento</Label>
                      <Input type="date" value={childData.birth_date} onChange={e => updateChildField("birth_date", e.target.value)} className="h-12 rounded-2xl border-2" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha de Diagnóstico</Label>
                      <Input type="date" value={childData.diagnosis_date} onChange={e => updateChildField("diagnosis_date", e.target.value)} className="h-12 rounded-2xl border-2" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sexo de Nacimiento</Label>
                      <RadioGroup value={childData.sexo_nacimiento} onValueChange={v => updateChildField("sexo_nacimiento", v)} className="flex gap-6 mt-2 px-2">
                        <div className="flex items-center gap-2"><RadioGroupItem value="hombre" id="s-h" /><Label htmlFor="s-h" className="font-bold">Hombre</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="mujer" id="s-m" /><Label htmlFor="s-m" className="font-bold">Mujer</Label></div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identidad de Género</Label>
                      <Input value={childData.identidad_genero} onChange={e => updateChildField("identidad_genero", e.target.value)} placeholder="¿Cómo se identifica?" className="h-12 rounded-2xl border-2" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nacionalidad</Label>
                      <Input value={childData.nacionalidad} onChange={e => updateChildField("nacionalidad", e.target.value)} className="h-12 rounded-2xl border-2" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ciudad / Provincia</Label>
                      <Input value={childData.ciudad_provincia} onChange={e => updateChildField("ciudad_provincia", e.target.value)} className="h-12 rounded-2xl border-2" />
                    </div>
                    <div className="sm:col-span-2">
                      {renderMultiSelect("idiomas_casa", ["Español", "Inglés", "Kichwa", "Francés", "Otro"], "Idiomas en Casa")}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nivel de Apoyo TEA</Label>
                      <RadioGroup value={childData.nivel_apoyo} onValueChange={v => updateChildField("nivel_apoyo", v)} className="flex gap-6 mt-2 px-2">
                        {["nivel_1", "nivel_2", "nivel_3"].map(n => (
                          <div key={n} className="flex items-center gap-2">
                            <RadioGroupItem value={n} id={`n-${n}`} />
                            <Label htmlFor={`n-${n}`} className="font-bold uppercase text-xs">{n.replace("_", " ")}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. FAMILIA E INTERACCIÓN SOCIAL (RECUPERADO) */}
              <AccordionItem value="familia" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><Users size={20} /> Familia e Interacción</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-8 pb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2">Datos Maternos</h4>
                      <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">Nombre Madre</Label><Input value={childData.nombre_madre} onChange={e => updateChildField("nombre_madre", e.target.value)} className="h-10 rounded-xl border-2" /></div>
                      <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">Teléfono Madre</Label><Input value={childData.telefono_madre} onChange={e => updateChildField("telefono_madre", e.target.value)} className="h-10 rounded-xl border-2" /></div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2">Datos Paternos</h4>
                      <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">Nombre Padre</Label><Input value={childData.nombre_padre} onChange={e => updateChildField("nombre_padre", e.target.value)} className="h-10 rounded-xl border-2" /></div>
                      <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">Teléfono Padre</Label><Input value={childData.telefono_padre} onChange={e => updateChildField("telefono_padre", e.target.value)} className="h-10 rounded-xl border-2" /></div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-4 border-t">
                    {renderMultiSelect("circulo_interaccion", ["Padre", "Madre", "Abuelos", "Tíos", "Hermanos", "Primos"], "Círculo de Interacción Cercano")}
                    
                    <div className="space-y-4">
                      {renderMultiSelect("interaccion_animales", ["Perro", "Gato", "Hamster", "Aves", "Peces", "Otro"], "Interacción con Mascotas")}
                      {childData.interaccion_animales.includes("Otro") && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Especifique Otros Animales</Label>
                          <Input value={childData.interaccion_animales_otro} onChange={e => updateChildField("interaccion_animales_otro", e.target.value)} placeholder="Ej: Caballos, Conejos..." className="h-12 rounded-2xl border-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 3. SALUD Y DESARROLLO (RECUPERADO) */}
              <AccordionItem value="salud" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><Heart size={20} /> Salud y Desarrollo</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-8 pb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest ml-1">Edad Primera Palabra</Label><Input value={childData.edad_primera_palabra} onChange={e => updateChildField("edad_primera_palabra", e.target.value)} placeholder="Ej: 18 meses" className="h-12 rounded-2xl border-2" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest ml-1">Edad al Caminar</Label><Input value={childData.edad_caminar} onChange={e => updateChildField("edad_caminar", e.target.value)} placeholder="Ej: 14 meses" className="h-12 rounded-2xl border-2" /></div>
                  </div>

                  <div className="p-6 bg-muted/20 rounded-[28px] border-2 border-transparent hover:border-primary/5 transition-all space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="font-black text-sm uppercase tracking-tight">¿Hubo Regresión?</Label>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Pérdida de habilidades adquiridas</p>
                      </div>
                      <Switch checked={childData.regresion} onCheckedChange={v => updateChildField("regresion", v)} />
                    </div>

                    {childData.regresion && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Edad de la Regresión</Label><Input value={childData.edad_regresion} onChange={e => updateChildField("edad_regresion", e.target.value)} className="h-12 rounded-2xl border-2" /></div>
                        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Detalles de la Regresión</Label><Textarea value={childData.detalle_regresion} onChange={e => updateChildField("detalle_regresion", e.target.value)} className="rounded-2xl border-2 min-h-[100px]" /></div>
                      </div>
                    )}
                  </div>

                  {renderMultiSelect("comorbilidades", ["TDAH", "Ansiedad", "Epilepsia", "Gastrointestinal", "Sueño", "Déficit Cognitivo"], "Comorbilidades Médicas")}
                </AccordionContent>
              </AccordionItem>

              {/* 4. PERFIL SENSORIAL COMPLETO */}
              <AccordionItem value="sensorial" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><Activity size={20} /> Perfil Sensorial</div>
                </AccordionTrigger>
                <AccordionContent className="pb-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderScale("sensorial_auditiva", "Sensibilidad Auditiva")}
                    {renderScale("sensorial_visual", "Sensibilidad Visual")}
                    {renderScale("sensorial_tactil", "Sensibilidad Táctil")}
                    {renderScale("sensorial_gusto_olfato", "Gusto / Olfato")}
                    {renderScale("sensorial_propioceptiva", "Propioceptiva (Cuerpo)")}
                    {renderScale("sensorial_vestibular", "Vestibular (Equilibrio)")}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 5. PERFIL MOTOR COMPLETO */}
              <AccordionItem value="motor" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><Activity size={20} /> Perfil Motor</div>
                </AccordionTrigger>
                <AccordionContent className="pb-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderScale("motor_fina", "Motricidad Fina")}
                    {renderScale("motor_gruesa", "Motricidad Gruesa")}
                    {renderScale("motor_coordinacion", "Coordinación")}
                    {renderScale("motor_equilibrio", "Equilibrio")}
                    {renderScale("motor_pinza", "Pinza Manual")}
                    {renderScale("motor_escritura", "Escritura")}
                    {renderScale("motor_utensilios", "Uso de Utensilios")}
                  </div>
                  <div className="mt-6 p-6 bg-muted/20 rounded-[28px] border-2 border-transparent">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="font-black text-sm uppercase tracking-tight">Práctica Deporte</Label>
                      <Switch checked={childData.practica_deporte} onCheckedChange={v => updateChildField("practica_deporte", v)} />
                    </div>
                    {childData.practica_deporte && <Input value={childData.deportes_practicados} onChange={e => updateChildField("deportes_practicados", e.target.value)} placeholder="¿Qué deportes?" className="h-12 rounded-2xl border-2" />}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 6. HABILIDADES ADAPTATIVAS */}
              <AccordionItem value="adaptativa" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><Brain size={20} /> Habilidades Adaptativas</div>
                </AccordionTrigger>
                <AccordionContent className="pb-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderScale("autonomia_vestido", "Nivel de Autonomía al vestirse")}
                    {renderScale("autonomia_alimentacion", "Nivel de Autonomía al comer")}
                    {renderScale("autonomia_higiene", "Higiene / Baño")}
                    {renderScale("autonomia_sueno", "Hábito de Sueño")}
                    {renderScale("adaptativa_transiciones", "Cambios / Transiciones")}
                    {renderScale("adaptativa_rutinas", "Seguimiento de Rutinas")}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 7. COMUNICACIÓN Y LENGUAJE COMPLETO */}
              <AccordionItem value="comunicacion" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><MessageSquare size={20} /> Comunicación y Lenguaje</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-8 pb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Lenguaje Expresivo</Label>
                      <RadioGroup value={childData.lenguaje_expresivo} onValueChange={v => updateChildField("lenguaje_expresivo", v)} className="space-y-2">
                        {["no_verbal", "palabras_sueltas", "frases_conversacional"].map(o => (
                          <div key={o} className="flex items-center gap-2"><RadioGroupItem value={o} id={`lexp-${o}`} /><Label htmlFor={`lexp-${o}`} className="text-xs font-bold capitalize">{o.replace("_", " ")}</Label></div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Lenguaje Receptivo</Label>
                      <RadioGroup value={childData.lenguaje_receptivo} onValueChange={v => updateChildField("lenguaje_receptivo", v)} className="space-y-2">
                        {["ordenes_simples", "instrucciones_pasos", "doble_sentido"].map(o => (
                          <div key={o} className="flex items-center gap-2"><RadioGroupItem value={o} id={`lrec-${o}`} /><Label htmlFor={`lrec-${o}`} className="text-xs font-bold capitalize">{o.replace("_", " ")}</Label></div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                  {renderMultiSelect("dificultades_comunicacion", ["Turnos", "Contacto Visual", "Inicio Interacción", "Mantenimiento Tema"], "Dificultades Específicas")}
                  {renderMultiSelect("habilidades_socioemocionales", ["Respuesta Nombre", "Atención Conjunta", "Juego Simbólico", "Empatía"], "Habilidades Socioemocionales")}
                </AccordionContent>
              </AccordionItem>

              {/* 8. EDUCACIÓN Y ACADÉMICO (RECUPERADO) */}
              <AccordionItem value="educacion" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><School size={20} /> Entorno Educativo</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-8 pb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Institución Educativa</Label><Input value={childData.nombre_establecimiento} onChange={e => updateChildField("nombre_establecimiento", e.target.value)} className="h-12 rounded-2xl border-2" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Año Escolar</Label><Input value={childData.anio_escolar} onChange={e => updateChildField("anio_escolar", e.target.value)} className="h-12 rounded-2xl border-2" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Nombre del Profesor/a</Label><Input value={childData.nombre_profesor} onChange={e => updateChildField("nombre_profesor", e.target.value)} className="h-12 rounded-2xl border-2" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase ml-1">Teléfono Profesor/a</Label><Input value={childData.telefono_profesor} onChange={e => updateChildField("telefono_profesor", e.target.value)} className="h-12 rounded-2xl border-2" /></div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                      <div className="space-y-1">
                        <Label className="font-bold text-xs uppercase">¿Profesor Sombra?</Label>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight">Profesional que acompaña en el aula</p>
                      </div>
                      <Switch checked={childData.profesor_sombra} onCheckedChange={v => updateChildField("profesor_sombra", v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                      <Label className="font-bold text-xs uppercase">Diagnóstico TEA</Label>
                      <Switch checked={childData.diagnostico_tea} onCheckedChange={v => updateChildField("diagnostico_tea", v)} />
                    </div>
                  </div>

                  {renderMultiSelect("problemas_academicos", ["Matemáticas", "Lectura", "Escritura", "Atención", "Socialización"], "Dificultades Académicas (Problemas en Escuela)")}
                </AccordionContent>
              </AccordionItem>

              {/* 9. CONDUCTAS Y EMOCIONES COMPLETO */}
              <AccordionItem value="conductas" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><Activity size={20} /> Conductas y Emociones</div>
                </AccordionTrigger>
                <AccordionContent className="pb-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderScale("cd_autoagresion", "Autoagresión")}
                    {renderScale("cd_berrinches", "Berrinches Intensos")}
                    {renderScale("cd_fuga", "Fuga / Deambulación")}
                    {renderScale("cd_destruccion", "Destrucción Objetos")}
                  </div>
                  {renderMultiSelect("conductas_desafiantes", ["Gritos", "Mordidas", "Golpes", "Lanzar Objetos", "Estereotipias"], "Conductas Observadas")}
                  {renderMultiSelect("emociones_reconocidas", ["Alegría", "Tristeza", "Enojo", "Miedo", "Frustración", "Calma", "Ansiedad"], "Emociones que Reconoce")}
                </AccordionContent>
              </AccordionItem>

              {/* 10. FORTALEZAS Y MOTIVADORES (RECUPERADO) */}
              <AccordionItem value="fortalezas" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><Star size={20} /> Fortalezas y Talentos</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-8 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Intereses Apasionantes</Label><Textarea value={childData.fortalezas_intereses} onChange={e => updateChildField("fortalezas_intereses", e.target.value)} placeholder="Ej: Dinosaurios, planetas..." className="rounded-2xl border-2" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Refuerzos y Premios</Label><Textarea value={childData.fortalezas_refuerzos} onChange={e => updateChildField("fortalezas_refuerzos", e.target.value)} placeholder="¿Qué le motiva?" className="rounded-2xl border-2" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Actividades Favoritas</Label><Textarea value={childData.fortalezas_actividades} onChange={e => updateChildField("fortalezas_actividades", e.target.value)} className="rounded-2xl border-2" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Talentos Destacados</Label><Textarea value={childData.fortalezas_talentos} onChange={e => updateChildField("fortalezas_talentos", e.target.value)} className="rounded-2xl border-2" /></div>
                  </div>
                  {renderMultiSelect("areas_competencia", ["Memoria", "Cálculo", "Pensamiento Visual", "Música", "Tecnología", "Arte"], "Áreas de Alta Competencia")}
                  {renderMultiSelect("materias_interes", ["Matemáticas", "Ciencias", "Historia", "Arte", "Música", "Ed. Física"], "Materias de Interés")}
                </AccordionContent>
              </AccordionItem>

              {/* 11. TERAPIAS ACTIVAS */}
              <AccordionItem value="terapias" className="border-2 rounded-[32px] px-6 bg-card shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline font-black text-xs uppercase tracking-[0.2em] py-6 text-primary">
                  <div className="flex items-center gap-3"><Sparkles size={20} /> Terapias e Intervención</div>
                </AccordionTrigger>
                <AccordionContent className="pb-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: "terapia_aba", label: "Conductual (ABA)" },
                      { id: "terapia_lenguaje", label: "Lenguaje" },
                      { id: "terapia_ocupacional", label: "Ocupacional" },
                      { id: "terapia_cognitiva", label: "Cognitivo-Conductual" },
                      { id: "terapia_sociales", label: "Habilidades Sociales" },
                    ].map(t => (
                      <div key={t.id} className="flex items-center justify-between p-5 bg-muted/20 rounded-[24px] border-2 border-transparent hover:border-primary/5 transition-all">
                        <Label className="font-black text-xs uppercase tracking-tight">{t.label}</Label>
                        <Switch checked={(childData as any)[t.id]} onCheckedChange={v => updateChildField(t.id, v)} />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>

            <div className="pt-8 sticky bottom-4 z-20">
              <Button 
                className="w-full h-18 bg-success hover:bg-success/90 text-white shadow-2xl shadow-success/30 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] gap-3" 
                onClick={handleSaveChild} 
                disabled={saving}
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                {saving ? "Sincronizando Perfil Integral..." : "Guardar Perfil PAI Completo"}
              </Button>
            </div>
          </TabsContent>

          {/* OTRAS PESTAÑAS (CUENTA Y ALERTAS) */}
          <TabsContent value="user" className="space-y-6 outline-none">
            <div className="bg-card border-2 rounded-[32px] p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20"><User size={32} /></div>
                <div><h3 className="font-black text-lg leading-none mb-1">Mi Cuenta</h3><p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Información Personal</p></div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombre Completo</Label><Input value={userName} onChange={e => setUserName(e.target.value)} className="h-12 rounded-2xl border-2" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Correo Electrónico</Label><Input value={userEmail} disabled className="h-12 rounded-2xl border-2 bg-muted/30 opacity-60" /></div>
              </div>
              <Button className="w-full h-14 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest" onClick={() => toast.success("Datos actualizados")}>Actualizar Mis Datos</Button>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-critical/10 flex items-center justify-center text-critical border border-critical/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight leading-none">Seguridad</h4>
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-1">Cambio de Contraseña</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nueva Contraseña</Label>
                    <Input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="h-12 rounded-2xl border-2" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Confirmar Contraseña</Label>
                    <Input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      placeholder="••••••••"
                      className="h-12 rounded-2xl border-2" 
                    />
                  </div>
                </div>

                <Button 
                  variant="outline"
                  className="w-full h-14 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-critical hover:text-white hover:border-critical transition-all"
                  onClick={handleChangePassword}
                  disabled={changingPass}
                >
                  {changingPass ? <Loader2 className="animate-spin mr-2" size={16} /> : <Lock size={16} className="mr-2" />}
                  Actualizar Contraseña
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6 outline-none">
            <div className="bg-card border-2 rounded-[32px] p-8 space-y-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-warning/10 rounded-2xl text-warning border-2 border-warning/10"><Bell size={24} /></div>
                  <div><h3 className="font-black text-lg leading-none mb-1">Notificaciones</h3><p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Configuración de Alertas</p></div>
                </div>
                <Switch checked={receiveAlerts} onCheckedChange={setReceiveAlerts} />
              </div>
              {receiveAlerts && (
                <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-top-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[{ id: "app", label: "App Push" }, { id: "email", label: "Email" }].map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border-2 border-transparent">
                        <Checkbox id={m.id} checked={alertMethods.includes(m.id)} onCheckedChange={() => setAlertMethods(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id])} />
                        <Label htmlFor={m.id} className="font-bold text-xs cursor-pointer">{m.label}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sensibilidad</Label><span className="text-[10px] font-black px-2 py-1 bg-primary/10 text-primary rounded-lg">Nivel {minSeverity}</span></div>
                    <Slider value={minSeverity} onValueChange={setMinSeverity} max={4} min={1} step={1} className="py-4" />
                  </div>
                </div>
              )}
              
              <div className="pt-6 mt-4 border-t border-slate-100">
                <Button 
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2" 
                  onClick={handleSaveAlerts} 
                  disabled={saving}
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {saving ? "Guardando..." : "Guardar Configuración de Alertas"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
