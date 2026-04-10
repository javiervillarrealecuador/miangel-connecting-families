export const currentUser = {
  name: "Juan García López",
  email: "juan.garcia@email.com",
  role: "Padre/Madre",
  phone: "+593-99-123-4567",
};

export const child = {
  name: "Lucas García",
  age: 5,
  birthDate: "2021-03-15",
  supportLevel: 2,
  diagnosis: "TEA",
  diagnosisDate: "2023-06-10",
  school: 'Escuela Primaria "El Desarrollo"',
  grade: "Jardín A",
  teacher: "Prof. María López",
};

export const activeGoal = {
  id: "1",
  title: "Coordinación Motora Fina",
  description: "Mejorar destreza con objetos pequeños (lápiz, cubiertos)",
  area: "Motor",
  progress: 52,
  targetDate: "2026-05-15",
  status: "active" as const,
  proposedBy: "Dr. García (Terapeuta)",
  activities: [
    { name: "Enhebrado de perlas", times: 3, effectiveness: "efectiva" },
    { name: "Escritura de números", times: 2, effectiveness: "regular" },
  ],
};

export const goals = [
  activeGoal,
  {
    id: "2",
    title: "Transiciones Emocionales",
    description: "Mejorar tolerancia a cambios de actividad y rutina",
    area: "Comportamiento",
    progress: 75,
    targetDate: "2026-06-01",
    status: "active" as const,
    proposedBy: "Juan García (Padre)",
    activities: [
      { name: "Respiración guiada", times: 4, effectiveness: "efectiva" },
      { name: "Anticipación visual", times: 3, effectiveness: "efectiva" },
    ],
  },
  {
    id: "3",
    title: "Lenguaje Expresivo",
    description: "Aumentar vocabulario funcional a 50 palabras",
    area: "Comunicación",
    progress: 100,
    targetDate: "2026-03-01",
    status: "completed" as const,
    proposedBy: "Dr. García (Terapeuta)",
    activities: [],
  },
];

export const observations = [
  {
    id: "1",
    type: "Comportamiento",
    icon: "😊",
    context: "Cocina",
    intensity: 4,
    description: "Rabieta porque quería cereal que no hay. Se calmó con respiración.",
    severity: "alta",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    hasAudio: true,
  },
  {
    id: "2",
    type: "Lenguaje",
    icon: "🗣️",
    context: "Escuela",
    intensity: 2,
    description: "Dijo 2 palabras nuevas durante clase de lenguaje. Muy participativo.",
    severity: "normal",
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    hasAudio: false,
  },
  {
    id: "3",
    type: "Motor",
    icon: "🏃",
    context: "Parque",
    intensity: 1,
    description: "Coordinación excelente durante juego con arena. Usó pinza correctamente.",
    severity: "baja",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    hasAudio: false,
  },
  {
    id: "4",
    type: "Social",
    icon: "🤝",
    context: "Casa (sala)",
    intensity: 3,
    description: "Buscó contacto visual durante videollamada con abuela. Sonrió 3 veces.",
    severity: "normal",
    timestamp: Date.now() - 26 * 60 * 60 * 1000,
    hasAudio: false,
  },
  {
    id: "5",
    type: "Sensorial",
    icon: "👂",
    context: "Piscina",
    intensity: 2,
    description: "Muy cómodo en agua. Realizó 15 movimientos seguidos sin molestia.",
    severity: "baja",
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
    hasAudio: true,
  },
];

export const alerts = [
  {
    id: "1",
    severity: "critical" as const,
    title: "Patrón Detectado",
    description: 'El niño ha tenido rabietas 3 veces en escuela esta semana. Posible causa: Cambios en rutina matutina.',
    action: "Revisar rutina matutina con profesor. Implementar anticipación visual.",
    timestamp: Date.now() - 30 * 60 * 1000,
    read: false,
    archived: false,
  },
  {
    id: "2",
    severity: "high" as const,
    title: "Nueva observación registrada",
    description: "Prof. María registró una observación de comportamiento en escuela con intensidad alta.",
    action: "Revisar observación y coordinar con terapeuta.",
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    read: false,
    archived: false,
  },
  {
    id: "3",
    severity: "normal" as const,
    title: 'Objetivo próximo a cumplirse',
    description: 'El objetivo "Transiciones Emocionales" está al 80%. ¡Casi lo logra!',
    action: null,
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    read: true,
    archived: false,
  },
  {
    id: "4",
    severity: "normal" as const,
    title: "Reporte semanal disponible",
    description: "El resumen semanal del 26 Mar - 1 Abr está listo para revisión.",
    action: null,
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    read: true,
    archived: true,
  },
  {
    id: "5",
    severity: "low" as const,
    title: "Nuevo miembro pendiente",
    description: "Prof. María López aún no ha verificado su cuenta.",
    action: "Reenviar invitación si es necesario.",
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    read: true,
    archived: true,
  },
];

export const teamMembers = [
  {
    id: "1",
    name: "Dr. García García",
    role: "Terapeuta de Lenguaje",
    email: "garcia@terapeuta.com",
    phone: "+593-98-765-4321",
    status: "active" as const,
    since: "2026-01-10",
    specialty: "Lenguaje, Pragmática",
    permissions: { viewObs: true, createObs: true, viewGoals: true, editGoals: false },
  },
  {
    id: "2",
    name: "Prof. María López",
    role: "Profesor/Educador",
    email: "maria@escuela.com",
    phone: "+593-98-111-2222",
    status: "pending" as const,
    since: "2026-04-08",
    specialty: "Educación Especial",
    permissions: { viewObs: true, createObs: true, viewGoals: true, editGoals: false },
  },
  {
    id: "3",
    name: "Dr. López Martínez",
    role: "Médico Especialista",
    email: "lopez@pediatria.com",
    phone: "+593-97-333-4444",
    status: "active" as const,
    since: "2025-11-05",
    specialty: "Neuropediatría",
    permissions: { viewObs: true, createObs: false, viewGoals: true, editGoals: true },
  },
];

export const suggestedActivities = [
  {
    id: "1",
    name: "Juego de Manos con Arena",
    icon: "🎨",
    objective: "Coordinación Motora Fina",
    contexts: ["Parque", "Playa"],
    duration: "15 minutos",
    description: 'Pide al niño que recoja objetos pequeños del arena (piedras de colores, cáscaras). Usa pinza (índice + pulgar). Refuerza motora fina y discriminación táctil.',
    effectiveness: 8,
    source: "Documentos Médicos Validados",
  },
  {
    id: "2",
    name: "Respiración Guiada",
    icon: "🧘",
    objective: "Calma / Comportamiento",
    contexts: ["Cualquier lugar"],
    duration: "2 minutos",
    description: 'Guía al niño: "Inflamos un globo imaginario" (inhalar 3s), "Lo soltamos despacio" (exhalar 5s). Repetir 5 veces. Ideal antes de transiciones.',
    effectiveness: 7,
    source: "Protocolo ABA Adaptado",
  },
  {
    id: "3",
    name: "Enhebrado de Perlas",
    icon: "📿",
    objective: "Coordinación Motora Fina",
    contexts: ["Casa", "Escuela"],
    duration: "10 minutos",
    description: 'Usar perlas grandes con cordón grueso. Progresar a perlas más pequeñas. Refuerza pinza fina y concentración visual.',
    effectiveness: 9,
    source: "Terapia Ocupacional",
  },
  {
    id: "4",
    name: "Carreras con Límites Visuales",
    icon: "🏃",
    objective: "Motor Grueso",
    contexts: ["Parque", "Patio"],
    duration: "10 minutos",
    description: 'Marcar líneas de salida y llegada con conos o piedras. El niño corre entre límites visuales claros. Refuerza coordinación y comprensión espacial.',
    effectiveness: 7,
    source: "Documentos Médicos Validados",
  },
  {
    id: "5",
    name: "Búsqueda de Objetos en Arena",
    icon: "🔍",
    objective: "Concentración",
    contexts: ["Playa", "Parque"],
    duration: "15 minutos",
    description: 'Esconder objetos pequeños en arena. El niño busca usando solo tacto. Refuerza discriminación sensorial y atención sostenida.',
    effectiveness: 8,
    source: "Terapia Ocupacional",
  },
];

export const previousReports = [
  { id: "1", type: "Semanal", period: "26 Mar - 1 Abr", status: "downloaded" },
  { id: "2", type: "Mensual", period: "Marzo 2026", status: "downloaded" },
  { id: "3", type: "Semanal", period: "19 - 25 Mar", status: "available" },
];

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? "s" : ""}`;
}
