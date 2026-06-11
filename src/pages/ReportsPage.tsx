import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Printer, FileUser, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ScaleBar = ({ value, max = 5 }: { value: number; max?: number }) => (
  <div className="flex gap-1 mt-1">
    {Array.from({ length: max }).map((_, i) => (
      <div
        key={i}
        className={`h-2 flex-1 rounded-full ${
          i < value
            ? value <= 2 ? "bg-green-500" : value <= 3 ? "bg-yellow-500" : "bg-red-500"
            : "bg-slate-200"
        }`}
      />
    ))}
  </div>
);

const Field = ({ label, value }: { label: string; value: any }) => (
  <div className="mb-2">
    <span className="font-semibold text-slate-600 uppercase text-[10px] block leading-tight">{label}</span>
    <p className="text-sm font-medium">{value || <span className="text-slate-400 italic">No especificado</span>}</p>
  </div>
);

const SectionHeader = ({ n, title }: { n: number; title: string }) => (
  <h2 className="text-sm md:text-base font-bold bg-slate-100 px-3 py-2 rounded-xl mb-4 border-l-4 border-primary shadow-sm">
    {n}. {title}
  </h2>
);

const getTendencia = (texto: string) => {
  if (!texto) return "Estable";
  const match = texto.match(/\*\*Tendencia Detectada:\*\*\s*(.+)/i);
  return match ? match[1].split("\n")[0].trim() : "Estable";
};

export default function ReportsPage() {
  const [childData, setChildData] = useState<any>(null);
  const [profileItems, setProfileItems] = useState<Record<string, string[]>>({});
  const [observations, setObservations] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teamData } = await supabase
        .from("equipo_pai")
        .select("persona_autismo_id")
        .eq("user_id", user.id)
        .limit(1);

      const pId = teamData?.[0]?.persona_autismo_id;
      if (!pId) { setLoading(false); return; }

      const [{ data: cData }, { data: items }, { data: obsData }, { data: sumData }] = await Promise.all([
        supabase.from("personas_autismo").select(`
          id, familia_id, full_name, birth_date, nivel_apoyo, identidad_genero, nacionalidad, ciudad_provincia,
          nombre_madre, telefono_madre, nombre_padre, telefono_padre, circulo_interaccion,
          tipo_escolaridad, nombre_establecimiento, anio_escolar, nombre_profesor, telefono_profesor, profesor_sombra
        `).eq("id", pId).single(),
        supabase.from("persona_perfil_items").select("catalogos(categoria, nombre)").eq("persona_id", pId),
        supabase.from("observaciones")
          .select("id, tipo, fecha_observacion, descripcion_texto, contexto, severidad, intensidad_escala")
          .eq("persona_autismo_id", pId)
          .order("fecha_observacion", { ascending: false })
          .limit(10),
        supabase.from("resumenes_consolidados")
          .select("id, created_at, resumen_texto")
          .eq("persona_autismo_id", pId)
          .order("created_at", { ascending: false })
          .limit(3)
      ]);

      if (cData) setChildData(cData);
      if (obsData) setObservations(obsData);
      if (sumData) setSummaries(sumData);

      const catalog: Record<string, string[]> = {};
      items?.forEach((item: any) => {
        if (!item.catalogos) return;
        const { categoria, nombre } = item.catalogos;
        if (!catalog[categoria]) catalog[categoria] = [];
        catalog[categoria].push(nombre);
      });
      setProfileItems(catalog);
      setLoading(false);
    };
    load();
  }, []);

  const handleGenerateAI = async () => {
    if (!childData?.id) {
      toast.error("No se encontró el perfil del niño.");
      return;
    }
    setGenerating(true);
    toast.info("mIAngel está analizando las observaciones para generar el consolidado...");

    try {
      // 1. Obtener observaciones recientes
      const { data: obsList, error: obsErr } = await supabase
        .from("observaciones")
        .select("id, tipo, fecha_observacion, descripcion_texto, contexto, severidad, intensidad_escala")
        .eq("persona_autismo_id", childData.id)
        .order("fecha_observacion", { ascending: false })
        .limit(30);

      if (obsErr) throw obsErr;

      if (!obsList || obsList.length === 0) {
        toast.warning("No hay observaciones registradas para este perfil. Registra al menos una observación primero.");
        setGenerating(false);
        return;
      }

      // 2. Formatear observaciones para Gemini
      const formattedObs = obsList.map((o: any) => 
        `- [${new Date(o.fecha_observacion).toLocaleDateString()}] Tipo: ${o.tipo}, Contexto: ${o.contexto || 'General'}, Intensidad: ${o.intensidad_escala || o.intensidad || 3}/5, Descripción: ${o.descripcion_texto}`
      ).join("\n");

      // 3. Llamar a la Edge Function segura
      const { data: parsedData, error: fnError } = await supabase.functions.invoke("generate-report", {
        body: { formattedObs }
      });

      if (fnError) throw fnError;

      if (parsedData && parsedData.error) {
        throw new Error(parsedData.error);
      }

      const finalTexto = `${parsedData.resumen_texto}\n\n**Tendencia Detectada:** ${parsedData.tendencia || "Estable"}\n\n**Cambios Observados:**\n${parsedData.cambios_comportamiento || "No detectados"}\n\n**Recomendaciones:**\n${parsedData.recomendaciones_futuro || "Ninguna"}`;

      const { data: { user } } = await supabase.auth.getUser();

      // 4. Guardar en resumenes_consolidados
      const { error: insertErr } = await supabase
        .from("resumenes_consolidados")
        .insert({
          persona_autismo_id: childData.id,
          familia_id: childData.familia_id,
          tipo_resumen: "semanal",
          resumen_texto: finalTexto,
          generado_por: user?.id || "agente_ia"
        });

      if (insertErr) throw insertErr;

      toast.success("¡Resumen consolidado generado por IA con éxito!");
      
      // 5. Recargar lista de resúmenes
      const { data: updatedSummaries } = await supabase
        .from("resumenes_consolidados")
        .select("id, created_at, resumen_texto")
        .eq("persona_autismo_id", childData.id)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (updatedSummaries) setSummaries(updatedSummaries);
    } catch (error: any) {
      console.error("Error al consolidar con IA:", error);
      toast.error(`Error al generar análisis con IA: ${error.message || error}`);
    } finally {
      setGenerating(false);
    }
  };

  const tags = (list: string[] = []) =>
    list.length > 0
      ? list.map((t, i) => (
          <span key={i} className="inline-block bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full mr-1 mb-1 uppercase tracking-tighter">
            {t}
          </span>
        ))
      : <span className="text-slate-400 italic text-[10px]">Ninguno</span>;

  const scaleLabelPrint = (v: number) =>
    v <= 1 ? "Sin dificultad" : v === 2 ? "Leve" : v === 3 ? "Moderada" : v === 4 ? "Alta" : "Severa";

  if (loading) return (
    <AppLayout><div className="p-8 animate-pulse text-muted-foreground flex flex-col items-center gap-4"><RefreshCw className="animate-spin text-primary" size={32} /><p className="font-black text-xs uppercase">Sincronizando mIAngel Intelligence...</p></div></AppLayout>
  );

  return (
    <AppLayout>
      {/* ────────── ÁREA DE IMPRESIÓN ────────── */}
      <div id="print-area" className="hidden print:block bg-white text-slate-900 p-10 font-sans leading-relaxed text-sm">
        {/* Encabezado */}
        <div className="flex justify-between items-start border-b-4 border-primary pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black text-primary tracking-tight">mIAngel</h1>
            <p className="text-slate-500 font-medium">Connecting Families · Plan de Acción Integral (PAI)</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">FICHA INTEGRAL</p>
            <p className="text-xs text-slate-500">Generado: {new Date().toLocaleDateString("es-EC")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <section>
            <SectionHeader n={1} title="Información del Niño/a" />
            <div className="grid grid-cols-3 gap-y-3 gap-x-6">
              <Field label="Nombre Completo" value={childData?.full_name} />
              <Field label="Fecha de Nacimiento" value={childData?.birth_date} />
              <Field label="Nivel de Apoyo TEA" value={childData?.nivel_apoyo?.replace("_", " ")} />
              <Field label="Identidad de Género" value={childData?.identidad_genero} />
              <Field label="Nacionalidad" value={childData?.nacionalidad} />
              <Field label="Ciudad / Provincia" value={childData?.ciudad_provincia} />
            </div>
          </section>

          <section>
            <SectionHeader n={2} title="Contactos Familiares" />
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-2xl p-4 bg-slate-50/50">
                <p className="font-bold border-b mb-3 pb-1 text-primary">Madre / Cuidadora</p>
                <Field label="Nombre" value={childData?.nombre_madre} />
                <Field label="Teléfono" value={childData?.telefono_madre} />
              </div>
              <div className="border rounded-2xl p-4 bg-slate-50/50">
                <p className="font-bold border-b mb-3 pb-1 text-primary">Padre / Cuidador</p>
                <Field label="Nombre" value={childData?.nombre_padre} />
                <Field label="Teléfono" value={childData?.telefono_padre} />
              </div>
            </div>
            <div className="mt-4">
              <span className="font-semibold text-slate-600 uppercase text-[10px] block mb-2 tracking-widest">Círculo de Interacción</span>
              {tags(childData?.circulo_interaccion || [])}
            </div>
          </section>

          <section>
            <SectionHeader n={3} title="Perfil Educativo" />
            <div className="grid grid-cols-3 gap-y-3 gap-x-6">
              <Field label="Tipo Escolaridad" value={childData?.tipo_escolaridad} />
              <Field label="Establecimiento" value={childData?.nombre_establecimiento} />
              <Field label="Año / Grado" value={childData?.anio_escolar} />
              <Field label="Profesor/a" value={childData?.nombre_profesor} />
              <Field label="Teléfono Profesor" value={childData?.telefono_profesor} />
              <Field label="Profesor Sombra" value={childData?.profesor_sombra ? "SÍ" : "NO"} />
            </div>
          </section>
          <section>
            <SectionHeader n={4} title="Resumen de Observaciones Recientes" />
            <div className="space-y-4">
              {observations.length > 0 ? (
                observations.map((obs, i) => (
                  <div key={i} className="border-b pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-[9px] uppercase text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                        {obs.tipo}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 italic">
                        {new Date(obs.fecha_observacion).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 leading-snug">{obs.descripcion_texto}</p>
                    <div className="flex gap-4 mt-2">
                      <div className="text-[8px] font-black uppercase text-slate-400">Contexto: <span className="text-slate-600">{obs.contexto || "No definido"}</span></div>
                      <div className="text-[8px] font-black uppercase text-slate-400">Severidad: <span className={obs.severidad === 'critica' || obs.severidad === 'alta' ? 'text-red-500' : 'text-success'}>{obs.severidad}</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs italic text-slate-400">No hay observaciones registradas recientemente.</p>
              )}
            </div>
          </section>
          <section>
            <SectionHeader n={5} title="Análisis Clínico Inteligente (mIAngel)" />
            <div className="space-y-4">
              {summaries.length > 0 ? (
                summaries.slice(0, 1).map((sum, i) => (
                  <div key={i} className="border-2 border-primary/20 rounded-2xl p-6 bg-primary/5">
                    <div className="flex justify-between items-center mb-4 border-b border-primary/10 pb-2">
                      <span className="font-black text-[10px] uppercase text-primary tracking-widest">
                        Resumen Consolidado
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {new Date(sum.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                      {sum.resumen_texto}
                    </div>
                    <div className="mt-4 pt-4 border-t border-primary/10">
                      <span className="text-[10px] font-bold uppercase text-slate-500 mr-2">Tendencia:</span>
                      <span className="text-[10px] font-black uppercase text-success">{getTendencia(sum.resumen_texto)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs italic text-slate-400">No hay análisis generados recientemente.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ────────── VISTA DE PANTALLA (OPTIMIZADA) ────────── */}
      <div className="animate-fade-in max-w-4xl mx-auto px-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter">Reportes Clínicos</h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Plan de Acción Integral</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none h-14 rounded-2xl border-2 font-black text-xs uppercase tracking-widest px-6" onClick={() => window.print()}>
              <Printer size={18} className="mr-2" /> PDF
            </Button>
            <Button 
              disabled={generating}
              className="flex-1 sm:flex-none h-14 rounded-2xl bg-slate-900 shadow-xl shadow-slate-200 font-black text-xs uppercase tracking-widest px-8 gap-2"
              onClick={handleGenerateAI}
            >
              {generating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
              IA CONSOLIDAR
            </Button>
          </div>
        </div>

        {/* Sección de Inteligencia IA (Nueva) */}
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {summaries.length > 0 ? (
              summaries.map((sum, i) => (
                <div key={i} className="bg-primary/[0.03] border-2 border-primary/10 rounded-[32px] p-6 md:p-8 relative overflow-hidden group shadow-sm">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles size={64} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1">Consolidado mIAngel</Badge>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(sum.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 rounded-xl border-primary/20 hover:bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest gap-2" 
                      onClick={() => window.print()}
                    >
                      <Printer size={14} /> PDF
                    </Button>
                  </div>
                  <h3 className="text-xl font-black text-foreground tracking-tight mb-4">Resumen Clínico Inteligente</h3>
                  <div className="prose prose-sm max-w-none text-foreground/80 font-medium leading-relaxed">
                    <p className="whitespace-pre-wrap">{sum.resumen_texto}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-primary/10 flex flex-wrap gap-4">
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Tendencia</p>
                      <Badge variant="outline" className="text-success border-success/20 bg-success/5 font-black text-[10px] uppercase">{getTendencia(sum.resumen_texto)}</Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-muted/10 border-2 border-dashed rounded-[32px] p-12 text-center">
                <Sparkles size={48} className="mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-bold text-muted-foreground">No hay análisis generados</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-6">Usa el botón "IA CONSOLIDAR" para que mIAngel analice los datos recientes.</p>
                <Button variant="outline" size="sm" onClick={handleGenerateAI} className="rounded-xl font-bold">Generar mi primer análisis</Button>
              </div>
            )}
          </div>
          <div className="bg-slate-900 rounded-[32px] p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Estado del PAI</p>
              <h3 className="text-2xl font-black tracking-tight leading-tight mb-4">Evolución Clínica</h3>
              <p className="text-xs font-medium opacity-80 leading-relaxed">
                mIAngel está procesando <span className="text-primary font-black">{observations.length} observaciones</span> recientes para detectar patrones de progreso.
              </p>
            </div>
            <div className="mt-8">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span>Completitud de Ficha</span>
                <span>92%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[92%]" />
              </div>
            </div>
          </div>
        </div>

        {childData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            {/* Tarjeta de Perfil */}
            <div className="bg-card border-2 rounded-[32px] p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-[20px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <FileUser size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="font-black text-foreground text-xl tracking-tight leading-none mb-1">{childData.full_name}</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nivel de Apoyo: {childData.nivel_apoyo?.replace("_", " ") || "Pendiente"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 p-5 rounded-2xl">
                <Field label="Lenguaje Expresivo" value={childData.lenguaje_expresivo} />
                <Field label="Lenguaje Receptivo" value={childData.lenguaje_receptivo} />
                <Field label="Identidad Género" value={childData.identidad_genero} />
                <Field label="Nacionalidad" value={childData.nacionalidad} />
              </div>
            </div>

            {/* Escalas Sensoriales */}
            <div className="bg-card border-2 rounded-[32px] p-6 md:p-8 shadow-sm">
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">🧠 Perfil Sensorial</h3>
              <div className="space-y-5">
                {[
                  ["Auditiva", childData.sensorial_auditiva],
                  ["Visual", childData.sensorial_visual],
                  ["Táctil", childData.sensorial_tactil],
                  ["Propioceptiva", childData.sensorial_propioceptiva],
                  ["Vestibular", childData.sensorial_vestibular],
                ].map(([label, val]) => (
                  <div key={label as string}>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase mb-2 tracking-tighter">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={`px-2 py-0.5 rounded-md ${val as number > 3 ? 'bg-red-50 text-red-600' : 'bg-success/10 text-success'}`}>{val}/5</span>
                    </div>
                    <ScaleBar value={val as number} />
                  </div>
                ))}
              </div>
            </div>

            {/* Conductas */}
            <div className="bg-card border-2 rounded-[32px] p-6 md:p-8 shadow-sm">
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">⚡ Conductas Desafiantes</h3>
              <div className="space-y-5">
                {[
                  ["Autoagresión", childData.cd_autoagresion],
                  ["Berrinches", childData.cd_berrinches],
                  ["Fuga / Huida", childData.cd_fuga],
                  ["Destrucción", childData.cd_destruccion],
                ].map(([label, val]) => (
                  <div key={label as string}>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase mb-2 tracking-tighter">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={`px-2 py-0.5 rounded-md ${val as number > 3 ? 'bg-red-50 text-red-600' : 'bg-success/10 text-success'}`}>{val}/5</span>
                    </div>
                    <ScaleBar value={val as number} />
                  </div>
                ))}
              </div>
            </div>

            {/* Perfil Social y Etiquetas */}
            <div className="bg-card border-2 rounded-[32px] p-6 md:p-8 shadow-sm md:col-span-2">
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-6">👥 Perfil Social y Comorbilidades</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div><span className="text-[10px] font-black text-muted-foreground uppercase block mb-2 tracking-widest">Círculo Social</span>{tags(childData?.circulo_interaccion || [])}</div>
                <div><span className="text-[10px] font-black text-muted-foreground uppercase block mb-2 tracking-widest">Habilidades Soc.</span>{tags(childData?.habilidades_sociales || [])}</div>
                <div><span className="text-[10px] font-black text-muted-foreground uppercase block mb-2 tracking-widest">Comorbilidades</span>{tags(childData?.comorbilidades || [])}</div>
                <div><span className="text-[10px] font-black text-muted-foreground uppercase block mb-2 tracking-widest">Temas de Interés</span>{tags(childData?.materias_interes || [])}</div>
                <div><span className="text-[10px] font-black text-muted-foreground uppercase block mb-2 tracking-widest">Dificultades Com.</span>{tags(childData?.dificultades_comunicacion || [])}</div>
                <div><span className="text-[10px] font-black text-muted-foreground uppercase block mb-2 tracking-widest">Habilidades Com.</span>{tags(childData?.habilidades_comunicativas || [])}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border-4 border-dotted rounded-[48px] p-16 text-center text-muted-foreground">
            <FileUser size={64} className="mx-auto mb-6 opacity-20" />
            <p className="font-black uppercase text-xs tracking-widest">Perfil no encontrado</p>
            <p className="text-sm mt-2 font-medium">Completa la Ficha PAI para generar este reporte.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
