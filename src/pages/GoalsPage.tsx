import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { goals as initialGoals } from "@/data/mockData";

export default function GoalsPage() {
  const [goalsList, setGoalsList] = useState(initialGoals);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newArea, setNewArea] = useState("");

  const active = goalsList.filter(g => g.status === "active");
  const completed = goalsList.filter(g => g.status === "completed");

  const handleCreate = () => {
    const g = {
      id: String(Date.now()),
      title: newTitle,
      description: newDesc,
      area: newArea,
      progress: 0,
      targetDate: "",
      status: "active" as const,
      proposedBy: "Tú - Padre",
      activities: [],
    };
    setGoalsList([g, ...goalsList]);
    setShowCreate(false);
    setNewTitle(""); setNewDesc(""); setNewArea("");
    toast.success("✓ Objetivo creado");
  };

  const markComplete = (id: string) => {
    setGoalsList(prev => prev.map(g => g.id === id ? { ...g, status: "completed" as const, progress: 100 } : g));
    toast.success("✓ Objetivo completado");
  };

  const GoalCard = ({ goal }: { goal: typeof initialGoals[0] }) => {
    const isOpen = expanded === goal.id;
    return (
      <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
        <button className="w-full text-left" onClick={() => setExpanded(isOpen ? null : goal.id)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>🎯</span>
              <h3 className="font-semibold text-foreground text-sm">{goal.title}</h3>
            </div>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{goal.area} · {goal.proposedBy}</p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{goal.progress}%</p>
        </button>
        {isOpen && (
          <div className="mt-3 pt-3 border-t animate-fade-in space-y-2 text-sm">
            <p className="text-foreground">{goal.description}</p>
            {goal.targetDate && <p className="text-muted-foreground">📅 Fecha objetivo: {goal.targetDate}</p>}
            {goal.activities.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Últimas actividades:</p>
                {goal.activities.map((a, i) => (
                  <p key={i} className="text-muted-foreground">• {a.name} ({a.times}x, {a.effectiveness})</p>
                ))}
              </div>
            )}
            {goal.status === "active" && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline">Editar</Button>
                <Button size="sm" variant="outline">Pausar</Button>
                <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => markComplete(goal.id)}>
                  Completado
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-6">Objetivos de Desarrollo</h1>

        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Activos ({active.length})</TabsTrigger>
            <TabsTrigger value="completed">Completados ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {active.map(g => <GoalCard key={g.id} goal={g} />)}
            {active.length === 0 && <p className="text-center text-muted-foreground py-8">No hay objetivos activos</p>}
          </TabsContent>
          <TabsContent value="completed" className="space-y-3">
            {completed.map(g => <GoalCard key={g.id} goal={g} />)}
          </TabsContent>
        </Tabs>

        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 z-20"
        >
          <Plus size={24} />
        </button>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear Objetivo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Título</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ej: Coordinación Motora" /></div>
              <div><Label>Descripción</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe el objetivo..." /></div>
              <div>
                <Label>Área</Label>
                <Select value={newArea} onValueChange={setNewArea}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                  <SelectContent>
                    {["Comunicación", "Social", "Motor", "Cognitivo", "Autonomía"].map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">Propuesto por: Tú - Padre</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button className="flex-1 bg-success text-success-foreground hover:bg-success/90" disabled={!newTitle || !newArea} onClick={handleCreate}>Crear</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
