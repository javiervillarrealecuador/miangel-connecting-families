import { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Loader2, BookOpen, Search, Filter, PlayCircle, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [libraryDocs, setLibraryDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [libLoading, setLibLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [childId, setChildId] = useState("");
  const [familiaId, setFamiliaId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: teamData } = await supabase
          .from("equipo_pai")
          .select("persona_autismo_id, familia_id")
          .eq("user_id", user.id)
          .limit(1);

        if (teamData && teamData.length > 0) {
          setChildId(teamData[0].persona_autismo_id);
          setFamiliaId(teamData[0].familia_id);
          fetchDocuments(teamData[0].persona_autismo_id);
        } else {
          setLoading(false);
        }
      }
    });
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const { data, error } = await supabase
        .from("documentos_validados")
        .select("id, titulo, autor, tipo_archivo, tipo_contenido, url_archivo")
        .order("titulo");
      
      if (data) setLibraryDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLibLoading(false);
    }
  };

  const fetchDocuments = async (pId: string) => {
    try {
      // Intentamos listar archivos del bucket "documents"
      const { data, error } = await supabase.storage.from("documentos_medicos").list(pId + '/');
      
      if (error) {
        console.error("Error fetching docs:", error);
        // Podría fallar si el bucket no existe aún
      } else if (data) {
        setDocuments(data.map(f => ({
          name: f.name,
          id: f.id,
          created_at: f.created_at,
          size: f.metadata?.size || 0
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      toast.error("Por favor sube solo archivos PDF.");
      return;
    }
    
    if (!childId) {
      toast.error("No se encontró el perfil del niño.");
      return;
    }

    setUploading(true);
    
    const filePath = `${childId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from("documentos_medicos")
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      if (error.message.includes("Bucket not found")) {
        toast.error("El bucket 'documentos_medicos' no existe en Supabase. Por favor créalo primero.");
      } else {
        toast.error("Error al subir el archivo.");
      }
    } else {
      toast.success("Documento subido correctamente. La IA ha sido notificada.");
      fetchDocuments(childId); // Recargar la lista
    }
    
    setUploading(false);
    // Limpiar input
    e.target.value = '';
  };

  const handleDelete = async (fileName: string) => {
    const { error } = await supabase.storage
      .from("documentos_medicos")
      .remove([`${childId}/${fileName}`]);

    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success("Documento eliminado");
      setDocuments(prev => prev.filter(d => d.name !== fileName));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("documentos_medicos")
        .createSignedUrl(`${childId}/${fileName}`, 60); // URL válida por 60 segundos

      if (error) {
        toast.error("Error al obtener el enlace de descarga");
        return;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al abrir el documento");
    }
  };

  const filteredLibrary = libraryDocs.filter(doc => 
    doc.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.autor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-5xl mx-auto px-4 pb-20">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-foreground tracking-tighter mb-2">Centro de Documentación</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em]">Archivos Clínicos y Biblioteca de Conocimiento</p>
        </div>

        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-10 bg-muted/50 p-1.5 rounded-[24px] h-16 md:h-20">
            <TabsTrigger value="mine" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-xl text-[10px] md:text-xs font-black uppercase tracking-widest gap-2">
              <FileText size={18} /> Mis Archivos
            </TabsTrigger>
            <TabsTrigger value="library" className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-xl text-[10px] md:text-xs font-black uppercase tracking-widest gap-2">
              <BookOpen size={18} /> Librería mIAngel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="outline-none space-y-8">
            <div className="bg-card border-2 border-dashed rounded-[40px] p-10 text-center relative overflow-hidden group hover:border-primary/50 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-[24px] flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
                <Upload size={32} />
              </div>
              <h3 className="font-black text-xl mb-2 tracking-tight text-slate-900">Subir nuevo documento</h3>
              <p className="text-xs font-medium text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
                Sube diagnósticos y evaluaciones en PDF. Nuestra IA los analizará para personalizar el apoyo de tu hijo.
              </p>
              
              <div className="relative inline-block">
                <Button disabled={uploading} className="h-14 px-10 rounded-2xl bg-primary shadow-2xl shadow-primary/20 font-black text-[10px] uppercase tracking-widest">
                  {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</> : "Seleccionar PDF"}
                </Button>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-full flex justify-center p-20 animate-pulse text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                  <Loader2 className="animate-spin mr-3" /> Sincronizando documentos...
                </div>
              ) : documents.length === 0 ? (
                <div className="col-span-full text-center p-20 bg-muted/10 rounded-[40px] border-2 border-dashed">
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Sin archivos todavía</p>
                </div>
              ) : (
                documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-card border-2 rounded-[24px] hover:shadow-xl hover:-translate-y-1 transition-all group">
                    <div 
                      className="flex items-center gap-4 overflow-hidden cursor-pointer flex-1"
                      onClick={() => handleDownload(doc.name)}
                    >
                      <div className="w-12 h-12 bg-primary/5 text-primary rounded-[14px] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-slate-800 truncate leading-none mb-1">
                          {doc.name.split('_').slice(1).join('_') || doc.name}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {new Date(doc.created_at).toLocaleDateString()} • {formatSize(doc.size)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:bg-red-50 hover:text-red-500 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.name);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="library" className="outline-none space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                <Input 
                  placeholder="Buscar guías, manuales o tutoriales..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 rounded-2xl border-2 focus-visible:ring-primary/20 font-medium"
                />
              </div>
              <Button variant="outline" className="h-14 rounded-2xl border-2 px-6 font-black text-[10px] uppercase tracking-widest gap-2">
                <Filter size={16} /> Áreas
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {libLoading ? (
                <div className="col-span-full flex justify-center p-20 animate-pulse text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                  <Loader2 className="animate-spin mr-3" /> Cargando librería clínica...
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div className="col-span-full text-center p-20 bg-muted/10 rounded-[40px] border-2 border-dashed">
                  <Search className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">No encontramos recursos para esa búsqueda</p>
                </div>
              ) : (
                filteredLibrary.map((doc, i) => (
                  <div key={i} className="bg-white border-2 rounded-[32px] p-6 shadow-sm hover:shadow-2xl hover:border-primary/30 transition-all flex flex-col h-full group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-slate-100 rounded-[18px] text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {doc.tipo_archivo === 'video' ? <PlayCircle size={24} /> : <FileText size={24} />}
                      </div>
                      <Badge variant="secondary" className="bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest border-none px-2.5 py-1">
                        {doc.tipo_contenido.replace('pdf_', '').replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <h3 className="font-black text-lg text-slate-900 tracking-tight leading-snug mb-2 flex-grow">
                      {doc.titulo}
                    </h3>
                    
                    <div className="space-y-4 pt-4 border-t border-slate-50 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                          {doc.autor.substring(0, 1)}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{doc.autor}</span>
                      </div>
                      
                      <Button 
                        asChild 
                        className="w-full h-12 rounded-xl bg-slate-900 hover:bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200"
                      >
                        <a href={doc.url_archivo} target="_blank" rel="noopener noreferrer">
                          {doc.tipo_archivo === 'video' ? (
                            <><PlayCircle size={14} className="mr-2" /> Ver Tutorial</>
                          ) : (
                            <><ExternalLink size={14} className="mr-2" /> Abrir Guía</>
                          )}
                        </a>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
