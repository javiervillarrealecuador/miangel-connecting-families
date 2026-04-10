import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [childName, setChildName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [gender, setGender] = useState("");

  // Step 2
  const [diagDate, setDiagDate] = useState("");
  const [supportLevel, setSupportLevel] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);

  // Step 3
  const [attendsSchool, setAttendsSchool] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [grade, setGrade] = useState("");
  const [teacher, setTeacher] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Español"]);
  const [household, setHousehold] = useState<string[]>([]);

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-lg bg-card rounded-xl shadow-lg p-8 animate-fade-in">
        <p className="text-sm text-muted-foreground mb-1">Paso {step} de 3</p>
        <Progress value={progress} className="h-2 mb-6" />

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Cuéntanos sobre tu hijo</h2>
            <div><Label>Nombre</Label><Input value={childName} onChange={e => setChildName(e.target.value)} placeholder="Lucas" /></div>
            <div><Label>Fecha de nacimiento</Label><Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
            <div>
              <Label>Sexo</Label>
              <RadioGroup value={sex} onValueChange={setSex} className="flex flex-wrap gap-3 mt-1">
                {["Masculino", "Femenino", "Otro", "Prefiero no decir"].map(o => (
                  <div key={o} className="flex items-center gap-1.5"><RadioGroupItem value={o} id={`sex-${o}`} /><Label htmlFor={`sex-${o}`} className="text-sm">{o}</Label></div>
                ))}
              </RadioGroup>
            </div>
            <div><Label>Identidad de género (opcional)</Label><Input value={gender} onChange={e => setGender(e.target.value)} placeholder="Opcional" /></div>
            <div className="flex justify-end">
              <Button disabled={!childName || !birthDate || !sex} onClick={() => setStep(2)}>Siguiente</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Información Médica</h2>
            <div><Label>Fecha de diagnóstico</Label><Input type="date" value={diagDate} onChange={e => setDiagDate(e.target.value)} /></div>
            <div>
              <Label>Nivel de apoyo</Label>
              <RadioGroup value={supportLevel} onValueChange={setSupportLevel} className="flex gap-4 mt-1">
                {["Nivel 1", "Nivel 2", "Nivel 3"].map(l => (
                  <div key={l} className="flex items-center gap-1.5"><RadioGroupItem value={l} id={l} /><Label htmlFor={l} className="text-sm">{l}</Label></div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>Instrumentos de diagnóstico</Label>
              <div className="flex flex-wrap gap-3 mt-1">
                {["ADOS", "DSM-5", "CARS", "Otros"].map(i => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Checkbox id={`inst-${i}`} checked={instruments.includes(i)} onCheckedChange={() => setInstruments(toggleArr(instruments, i))} />
                    <Label htmlFor={`inst-${i}`} className="text-sm">{i}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
              ℹ️ Esta información nos ayuda a personalizar recomendaciones
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button disabled={!diagDate || !supportLevel} onClick={() => setStep(3)}>Siguiente</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Contexto Educativo y Familiar</h2>
            <div className="flex items-center gap-3">
              <Label>¿Asiste a escuela?</Label>
              <Switch checked={attendsSchool} onCheckedChange={setAttendsSchool} />
            </div>
            {attendsSchool && (
              <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                <div><Label>Nombre institución</Label><Input value={schoolName} onChange={e => setSchoolName(e.target.value)} /></div>
                <div><Label>Grado</Label><Input value={grade} onChange={e => setGrade(e.target.value)} /></div>
                <div><Label>Profesor</Label><Input value={teacher} onChange={e => setTeacher(e.target.value)} /></div>
              </div>
            )}
            <div>
              <Label>Idiomas en casa</Label>
              <div className="flex gap-3 mt-1">
                {["Español", "Inglés", "Otro"].map(l => (
                  <div key={l} className="flex items-center gap-1.5">
                    <Checkbox id={`lang-${l}`} checked={languages.includes(l)} onCheckedChange={() => setLanguages(toggleArr(languages, l))} />
                    <Label htmlFor={`lang-${l}`} className="text-sm">{l}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Personas en casa</Label>
              <div className="flex flex-wrap gap-3 mt-1">
                {["Padre", "Madre", "Abuelo", "Hermanos", "Otros"].map(p => (
                  <div key={p} className="flex items-center gap-1.5">
                    <Checkbox id={`hh-${p}`} checked={household.includes(p)} onCheckedChange={() => setHousehold(toggleArr(household, p))} />
                    <Label htmlFor={`hh-${p}`} className="text-sm">{p}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
              <Button className="bg-success text-success-foreground hover:bg-success/90 flex-1 ml-3 btn-touch" onClick={() => navigate("/dashboard")}>
                Crear Perfil
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
