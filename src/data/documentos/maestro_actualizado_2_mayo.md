# mIAngel - Documento Maestro Actualizado

**Versión:** 2.0 (ACTUALIZADO - Abril 2026)  
**Estado:** Supabase 100% configurado, listo para Lovable  
**Objetivo:** Coordinación terapéutica integrada para niños con autismo  
**Mercado:** Ecuador/Latinoamérica  
**Tiempo estimado para MVP:** 8-12 semanas desde hoy

---

## TABLA DE CONTENIDOS

1. [El Problema](#problema)
2. [La Solución (mIAngel)](#solucion)
3. [Propuesta de Valor por Usuario](#valor)
4. [Arquitectura Técnica](#arquitectura)
5. [Modelo de Datos (Completado)](#modelo-datos)
6. [Funcionalidades Clave](#funcionalidades)
7. [Flujos de Usuario](#flujos)
8. [MVP - Qué Incluye](#mvp)
9. [Roadmap 16 Semanas](#roadmap)
10. [Stack Tecnológico](#stack)
11. [KPIs de Éxito](#kpis)
12. [Modelo de Negocio](#negocio)
13. [Go-to-Market](#gtm)
14. [Status Actual](#status)

---

## 1. EL PROBLEMA {#problema}

### Situación Actual en Ecuador/Latinoamérica

Los niños con Trastorno del Espectro Autista (TEA) necesitan intervenciones coordinadas entre:
- 👨‍👩‍👧 **Familia** (padres)
- 👨‍🏫 **Escuela** (docentes, responsable DECE)
- 👨‍⚕️ **Médicos** (pediatra, psicólogo, neurólogo)
- 💼 **Terapeutas externos** (lenguaje, ocupacional, conductual)

### Los Desafíos

**1. Fragmentación Extrema**
- Cada actor (médico, terapeuta, educador, familia) trabaja en silos
- No hay visión compartida del progreso del niño
- Duplicación de esfuerzos o peor: estrategias contradictorias

**Impacto:** El niño recibe mensajes inconsistentes. Si un terapeuta usa refuerzo positivo pero el profesor usa castigo, la confusión es total.

**2. Falta de Seguimiento en Tiempo Real**
- Si el niño tiene rabieta en casa, el médico se entera en la cita (semanas después)
- Las conductas desafiantes no se registran sistemáticamente
- Patrones se pierden

**Impacto:** Las decisiones terapéuticas se basan en información fragmentada y antigua.

**3. Acceso Desigual a Conocimiento**
- El padre no sabe qué hacer en casa
- La familia no tiene protocolos validados
- Actividades efectivas no se documentan

**Impacto:** Frustración, burnout, inefectividad.

**4. Sin Data para Mejorar**
- Cada institución guarda datos en silos (o ni siquiera los guarda)
- No hay análisis de qué intervenciones funcionan
- Decisiones se basan en intuición, no en evidencia

**Impacto:** El sistema no aprende. Las familias repiten los mismos errores.

---

## 2. LA SOLUCIÓN: mIAngel {#solucion}

### Visión

**"La sincronización que tu hijo merece. El apoyo que tu familia necesita."**

mIAngel es una **plataforma de coordinación terapéutica** que:
- 🔗 Conecta todos los actores (familia, médicos, terapeutas, educadores)
- 📊 Centraliza observaciones diarias del niño
- 🚨 Genera alertas automáticas para cambios importantes
- 💡 Sugiere actividades basadas en documentos médicos validados
- 🤖 Usa IA para detectar patrones y generar resúmenes
- 📈 Proporciona data para tomar mejores decisiones

### Diferenciadores

1. **Multi-actor desde el inicio** — No es app para padres solamente
2. **Observaciones en tiempo real** — No esperes a la cita
3. **Contextos libres, no dropdowns** — "Parque con muchas personas", no solo "parque"
4. **Audio + transcripción** — Los padres ocupados pueden registrar hablando
5. **Documentos validados médicamente** — No inventamos, compilamos
6. **IA integrada desde el diseño** — Patrones automáticos, no manuales
7. **Modelos de usuario complejos** — Permisos granulares (quién ve qué, quién puede editar qué)

---

## 3. PROPUESTA DE VALOR POR USUARIO {#valor}

### Para el Padre/Madre (Propietario de la Familia)

**Problema:** "No sé qué hacer en casa. Cada terapeuta me dice algo diferente."

**Solución mIAngel:**
- ✅ Panel unificado con todo el equipo (médicos, terapeutas, educadores)
- ✅ Registro diario de lo que observas (texto + audio)
- ✅ Alertas automáticas si algo cambia ("conducta agresiva aumentó 40%")
- ✅ Actividades sugeridas según objetivo activo + contexto (ej: "estoy en parque")
- ✅ Resúmenes mensuales con patrones detectados automáticamente

**ROI:** Menos ansiedad, intervenciones más coordin adas, mejor progreso del niño.

---

### Para el Terapeuta (Externo o Escolar)

**Problema:** "El padre no sigue mis indicaciones. El profesor no lo entiende."

**Solución mIAngel:**
- ✅ Proponer objetivos al padre (él aprueba)
- ✅ Ver observaciones diarias de toda la familia (contextos, conductas)
- ✅ Crear actividades en el banco para que familia/escuela las usen
- ✅ Recibir feedback automático ("aplicamos tu actividad 5 veces, funcionó 3")

**ROI:** Mejor adherencia, data de efectividad, equipo coordinado.

---

### Para el Médico/Especialista

**Problema:** "La familia dice una cosa en cita, pero luego no sé qué realmente pasó."

**Solución mIAngel:**
- ✅ Ver historial completo de observaciones (6 meses atrás)
- ✅ Patrones automáticos ("cada lunes conductas aumentan")
- ✅ Tomar decisiones basadas en data, no en lo que recuerdan
- ✅ Proponer cambios de medicación/estrategia con contexto completo

**ROI:** Decisiones más precisas, menos re-consultas, mejor outcomes.

---

### Para el Educador/Docente

**Problema:** "Tengo 25 niños. Cómo reporto específicamente sobre este niño con autismo."

**Solución mIAngel:**
- ✅ Registro rápido en clase (observación de 30 segundos)
- ✅ Ver objetivos del PAI (sabe qué se espera de él)
- ✅ Actividades sugeridas por contexto (aula, recreo, etc.)
- ✅ No compete con DECE, se integra

**ROI:** Mejor integración, menos frustración, contribuye al progreso.

---

## 4. ARQUITECTURA TÉCNICA {#arquitectura}

### Stack Completo

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                             │
│  React + Lovable.dev (UI/UX profesional)               │
│  Componentes: Login, Dashboard, Observaciones,          │
│  Objetivos, Actividades, Resúmenes, Alertas            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│                API / BACKEND                            │
│  Node.js + Express/NestJS                              │
│  • CRUD endpoints (observaciones, alertas, etc.)       │
│  • Lógica de alertas automáticas                       │
│  • Integración Claude API (IA)                         │
│  • Webhooks para n8n                                   │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
    ┌─────────┐  ┌─────────┐  ┌──────────┐
    │ Supabase│  │   n8n   │  │Claude API│
    │  (BD)   │  │ (Audio) │  │   (IA)   │
    └─────────┘  └─────────┘  └──────────┘
         ↓
    ┌──────────────────────────┐
    │  PostgreSQL + Storage    │
    │  • 26 tablas             │
    │  • RLS habilitado        │
    │  • Bucket: documentos    │
    └──────────────────────────┘
```

---

## 5. MODELO DE DATOS (COMPLETADO) {#modelo-datos}

### Tablas Principales (26 Total)

#### **Grupo 1: Fundación (Multi-tenancy)**

**familias** (NUEVA - Completada ✅)
- `id` UUID (primary key)
- `propietario_id` UUID → auth.users
- `nombre_familia` TEXT
- `pais`, `ciudad` TEXT
- `created_at`, `updated_at` TIMESTAMP

*Propósito:* Aislamiento total por familia. Todos los datos vinculan a esta tabla.

---

#### **Grupo 2: Personas y Equipos**

**personas_autismo** (EXISTENTE - Actualizada ✅)
- Campos originales: full_name, birth_date, diagnosis_date, 33 campos
- **NUEVO:** `familia_id` UUID → familias ✅

**equipo_pai** (EXISTENTE - Actualizada ✅)
- Campos originales: id, persona_autismo_id, user_id, rol, specialty, estado
- **NUEVOS CAMPOS AGREGADOS:** ✅
  - `familia_id` UUID → familias
  - `codigo_verificacion` TEXT (para invitación por email)
  - `codigo_verificacion_vence_at` TIMESTAMP
  - `codigo_verificado_at` TIMESTAMP
  - `puede_ver_historial` BOOLEAN (default: true)
  - `puede_crear_observaciones` BOOLEAN (default: true)
  - `puede_sugerir_objetivos` BOOLEAN (default: false)
  - `puede_crear_rutinas` BOOLEAN (default: false)
  - `puede_editar_objetivos` BOOLEAN (default: false)

*Propósito:* Modelo de permisos granular. Cada miembro tiene capacidades específicas.

---

#### **Grupo 3: Objetivos (PAI)**

**pai_goals** (EXISTENTE - Actualizada ✅)
- Campos originales: id, title, description, area, status, progress, target_date, persona_autismo_id, created_by, created_at
- **NUEVOS CAMPOS AGREGADOS:** ✅
  - `familia_id` UUID → familias
  - `propuesto_por` UUID → auth.users
  - `rol_propuso` TEXT
  - `aprobado_por` UUID → auth.users
  - `fecha_aprobacion` TIMESTAMP

*Propósito:* Workflow de aprobación. El padre es quien aprueba objetivos (propuestos por médicos/terapeutas).

---

#### **Grupo 4: Observaciones (CORAZÓN DEL SISTEMA)**

**observaciones** (NUEVA - Completada ✅)
- `id` UUID (primary key)
- `familia_id`, `persona_autismo_id` UUID → FK
- `registrado_por` UUID → auth.users
- `tipo` TEXT CHECK ('comportamiento' | 'lenguaje' | 'social' | 'motor' | 'sensorial' | 'adaptativo')
- `descripcion_texto` TEXT (descripción libre del comportamiento)
- `intensidad_escala` INTEGER (1-5)
- `url_audio` TEXT (si se registró audio)
- `texto_transcrito` TEXT (transcripción automática con n8n)
- `contexto` TEXT (libre: "parque con gente", "escuela aula 5", etc.)
- `severidad` TEXT ('critica' | 'alta' | 'normal' | 'baja')
- `alerta_generada` BOOLEAN
- `alerta_enviada_a` UUID[] (array de users notificados)
- `fecha_observacion`, `created_at` TIMESTAMP
- **Índices:** familia, persona, fecha, tipo

*Propósito:* Registro atómico de observaciones. Cada registro dispara alertas automáticas.

---

#### **Grupo 5: Alertas (NOTIFICACIONES)**

**alertas** (NUEVA - Completada ✅)
- `id` UUID
- `familia_id`, `persona_autismo_id` UUID
- `tipo` TEXT ('nueva_observacion' | 'cambio_comportamiento' | 'patron_detectado' | 'objetivo_proximo_vencer' | 'regresion' | 'sugerencia_estrategia')
- `descripcion` TEXT
- `severidad` TEXT
- `observacion_id`, `pai_goal_id` UUID (FK opcionales)
- `enviado_a` UUID[] (equipo notificado)
- `leida_por` UUID[] (quién las leyó)
- `accion_sugerida` TEXT
- `creada_por` TEXT (sistema o usuario)
- `created_at` TIMESTAMP

*Propósito:* Notificaciones estructuradas. Cada alerta linea a acciones.

---

#### **Grupo 6: Actividades (BANCO DE INTERVENCIONES)**

**actividades_sugeridas** (NUEVA - Completada ✅)
- `id` UUID
- `familia_id`, `persona_autismo_id`, `pai_goal_id` UUID
- `nombre`, `descripcion`, `instrucciones` TEXT
- `duracion_estimada_minutos` INTEGER
- `origen` TEXT ('documento_validado' | 'sugerencia_miembro' | 'generada_ia')
- `documento_fuente_id` UUID → documentos_validados
- `contextos_validos` TEXT[] (ej: ['casa', 'escuela', 'parque'])
- `veces_sugerida`, `veces_completada` INTEGER
- `efectividad_promedio` INTEGER (1-5)
- `creada_por`, `sugerida_por` UUID
- `activa` BOOLEAN
- `created_at`, `updated_at` TIMESTAMP

*Propósito:* Banco de actividades terapéuticas. Vinculadas a objetivos, con tracking de efectividad.

---

#### **Grupo 7: Documentos Validados (LIBRERÍA MÉDICA)**

**documentos_validados** (NUEVA - Completada ✅)
- `id` UUID
- `titulo`, `descripcion`, `autor` TEXT
- `fecha_publicacion` DATE
- `tipo_archivo` TEXT (pdf, video, docx, xlsx, pptx, jpg, png, etc.) ✅
- `tipo_contenido` TEXT (pdf_guia, video_tutorial, articulo_cientifico, etc.) ✅
- `ruta_archivo`, `url_archivo` TEXT (Supabase Storage)
- `tamaño_bytes`, `mime_type` TEXT
- `contenido_indexable` TEXT (para búsqueda full-text)
- `palabras_clave` TEXT[] (tags)
- `duracion_minutos` (para videos)
- `numero_paginas` (para PDFs)
- `idioma`, `nivel_complejidad` TEXT
- `validado_por` UUID, `fecha_validacion` DATE
- `organismo_validador` TEXT (Ministerio Salud Ecuador, ASHA, etc.)
- `areas_cobertura` TEXT[] (comunicacion, motor, social, sensorial, etc.)
- `publico`, `activo` BOOLEAN
- `descargas_count`, `rating_promedio`, `numero_ratings` INTEGER/DECIMAL

*Propósito:* Librería centralizada. PDFs, videos, documentos validados para que IA los use al sugerir actividades.

---

#### **Grupo 8: Resúmenes (CONSOLIDACIÓN IA)**

**resumenes_consolidados** (NUEVA - Completada ✅)
- `id` UUID
- `familia_id`, `persona_autismo_id` UUID
- `tipo_resumen` TEXT ('diario' | 'semanal' | 'mensual')
- `fecha_inicio`, `fecha_fin` DATE
- `contenido_json` JSONB (estructura flexible)
- `resumen_texto` TEXT
- `cambios_comportamiento` TEXT
- `actividades_principales` TEXT
- `objetivos_avanzados` JSONB
- `recomendaciones_futuro` TEXT
- `alertas_detectadas` JSONB
- `patrones_identificados` JSONB
- `generado_por` TEXT (agente_ia)
- `enviado_a` UUID[]

*Propósito:* Resúmenes generados automáticamente por Claude API. Consolidan observaciones en insights.

---

#### **Grupo 9: Tablas de Soporte**

**retroalimentacion_actividades** (NUEVA - Completada ✅)
- Tracking de qué actividades funcionan
- `funcionamiento_efectivo`, `escala_efectividad`

**Tablas Existentes (Mantenidas Intactas):**
- conductas_desafiantes
- configuracion_sugerencias
- contactos_whatsapp
- document_vectors
- historial_interacciones
- intervenciones
- perfil_escalas, perfil_etiquetas
- recordatorios
- registro_sesiones
- rutinas_terapeuticas
- sugerencias_diarias
- user_profiles
- 4 vistas

*Propósito:* Tu infraestructura anterior se mantiene 100% intacta. mIAngel se integra encima.

---

### Resumen del Modelo

```
familias (raíz)
  ├── personas_autismo
  │   ├── observaciones
  │   ├── pai_goals
  │   ├── actividades_sugeridas
  │   └── resumenes_consolidados
  │
  ├── equipo_pai
  │   └── permisos granulares
  │
  └── documentos_validados
      └── librería centralizada
```

---

## 6. FUNCIONALIDADES CLAVE {#funcionalidades}

### 1. Perfil del Niño + Equipo PAI
- **Padre crea:** Perfil del niño (datos diagnósticos, contactos familiares)
- **Padre invita:** Médico, terapeuta, educador (verificación por código email)
- **Sistema:** Permisos automáticos según rol

### 2. Dashboard Unificado
- **Para padre:** "Equipo del niño", "Observaciones hoy", "Alertas urgentes", "Objetivos activos"
- **Para médico:** "Mis pacientes", "Observaciones recientes", "Patrones detectados"
- **Para terapeuta:** "Mis clientes", "Actividades sugeridas", "Feedback de efectividad"
- **Para educador:** "Mi grupo", "Objetivos PAI", "Contextos aula"

### 3. Registro de Observaciones (CORAZÓN)
- **Entrada:** Tipo (comportamiento/lenguaje/social/motor/sensorial) + Descripción libre + Escala 1-5 + Contexto libre + Audio opcional
- **Automático:** Transcripción de audio con n8n + Whisper
- **Disparador:** Alerta instantánea al equipo si severidad alta
- **Agregación:** Base de datos de patrones

### 4. Sistema de Alertas
- **Automáticas:** Cuando severidad > X o patrón detectado
- **Inteligentes:** "Conducta agresiva x 3 veces en 7 días" vs "Conducta aislada"
- **Notificación:** Email + Push + In-app
- **Acción:** Sugerencia de intervención o cambio de objetivo

### 5. Búsqueda de Actividades (CON IA)
- **Entrada:** Contexto libre ("estoy en parque", "escuela aula 4", "en casa lluvia")
- **Sistema:** Detecta objetivo activo + contexto + sugiere 3-5 actividades
- **Origen:** Documentos validados OR creadas por equipo OR generadas por IA
- **Feedback:** "¡Lo hicimos!" + escala efectividad

### 6. Resúmenes Consolidados (IA)
- **Disparador:** Manual o automático (cada viernes, cada mes)
- **Datos:** Última semana/mes de observaciones
- **Análisis:** Patrones, cambios, objetivos avanzados
- **Salida:** Resumen de texto + PDF descargable + Enviado por email

### 7. Agente IA Claude
- **Entrenado con:** Documentos médicos validados + ficha del niño + historial observaciones
- **Funciones:**
  - Detectar patrones sin que nadie lo pida
  - Sugerir actividades basadas en documentos
  - Generar resúmenes consolidados
  - Alertar sobre cambios anormales
- **Configuración:** Cloud API vs Fine-tuning (toggleable)

### 8. Gestión de Permisos
- **Granular:** Cada miembro puede tener capacidades diferentes
- **Por rol:** Padre (todo), Médico (ver + sugerir), Terapeuta (ver + crear), Educador (ver + crear obs. aula)
- **Historial:** Qué cambió y quién lo cambió
- **Auditoría:** Log de accesos (LGPD compliant)

---

## 7. FLUJOS DE USUARIO {#flujos}

### Flujo 1: Padre registra observación en tiempo real

```
Padre en parque
  ↓
Abre app → "+" → Nueva observación
  ↓
Tipo: "social"
Contexto: "parque con muchas personas"
Descripción: "Evitó contacto visual, se retiró al área solitaria"
Escala: 3/5
Audio: [Graba comentarios adicionales]
  ↓
Sistema transcribe audio automáticamente (n8n + Whisper)
  ↓
Severidad: NORMAL
  ↓
Alerta AUTOMÁTICA al equipo:
  "Nueva observación - Comportamiento social en contexto público"
  ↓
Médico ve alerta, revisa observación, valida patrón
```

### Flujo 2: Padre busca actividad para contexto actual

```
Padre en casa con lluvia, hijo aburrido
  ↓
Abre app → "Actividades"
  ↓
Ingresa contexto: "En casa, lluvia, solo nosotros dos"
  ↓
Sistema:
  1. Detecta objetivo activo (ej: "mejorar comunicación")
  2. Busca en documentos validados + banco local
  3. Filtra por contexto "casa interior"
  4. Sugiere 3 actividades:
     - "Juego de mesa cooperativo" (de PDF médico)
     - "Pictograma narrativo" (creada por terapeuta)
     - "Video educativo" (generada por IA)
  ↓
Padre elige → Realiza con niño
  ↓
Al terminar → "¡Lo hicimos!" + Escala funcionamiento (1-5)
  ↓
Sistema registra feedback (efectividad sube/baja)
```

### Flujo 3: Médico genera resumen semanal

```
Médico abre mIAngel
  ↓
Click "Generar resumen" → "Última semana"
  ↓
Sistema Claude API:
  1. Recupera observaciones de la semana
  2. Agrupa por tipo/contexto/severidad
  3. Detecta patrones
  4. Genera resumen estructurado
  ↓
Resumen:
  "Esta semana: 12 observaciones, 3 conductas agresivas (lunes),
   2 mejoras sociales (jueves). Patrón: conductas aumentan
   cuando ambiente es desestructurado. Recomendación: aumentar
   estructuración visual en aula."
  ↓
Médico lo lee → Lo ajusta si es necesario → Lo envía por email
  ↓
Padre, terapeuta, educador lo reciben
```

### Flujo 4: Terapeuta propone nuevo objetivo

```
Terapeuta revisa observaciones de última semana
  ↓
Identifica: "Fortalezas en motor grueso, debilidad en motor fino"
  ↓
Click "Proponer objetivo"
  ↓
Crea: "Mejorar motricidad fina (agarre de lápiz)"
  ↓
Enviado a padre como PROPUESTA
  ↓
Padre lo aprueba → Objetivo ACTIVO
  ↓
Sistema ahora sugiere actividades para este objetivo
  ↓
Terapeuta propone "Actividad de pintura" con instrucciones
  ↓
Padre lo usa en casa → Feedback → Terapeuta lo ajusta
```

---

## 8. MVP - QUÉ INCLUYE {#mvp}

### MVP Fase 1 (Semanas 1-4): Core Foundation

**Frontend (Lovable):**
- ✅ Login/Signup (email verificación)
- ✅ Onboarding: Crear familia → Crear niño → Invitar equipo
- ✅ Dashboard básico (equipo, observaciones, alertas, objetivos)
- ✅ Nueva observación (texto + escala + contexto)
- ✅ Lista de observaciones (filtrado por tipo/fecha)

**Backend:**
- ✅ CRUD observaciones
- ✅ Alertas automáticas (severidad simple)
- ✅ RLS configurado

**No en MVP:** Audio, n8n, IA, resúmenes, documentos

---

### MVP Fase 2 (Semanas 5-8): Inteligencia

**Frontend:**
- ✅ Búsqueda de actividades por contexto
- ✅ Resúmenes consolidados (lectura)
- ✅ Documentos validados (lectura)

**Backend:**
- ✅ Claude API integrada (sugerencias básicas)
- ✅ Generación de resúmenes
- ✅ Búsqueda en documentos

**No en MVP:** Audio/Whisper, Fine-tuning, patrones complejos

---

### MVP Fase 3 (Semanas 9-12): Automatización

**Frontend:**
- ✅ Audio en observaciones
- ✅ Permisos granulares (UI)
- ✅ Feedback de actividades

**Backend:**
- ✅ n8n + Whisper (transcripción automática)
- ✅ Patrones detectados por IA
- ✅ Alertas inteligentes

---

## 9. ROADMAP 16 SEMANAS {#roadmap}

```
SEMANA 1-2: Setup y Lovable
  └─ Supabase ✅ (ya hecho)
  └─ Generar UI/UX en Lovable
  └─ Conectar React con Supabase

SEMANA 3-4: Core MVP
  └─ CRUD observaciones
  └─ Alertas básicas
  └─ RLS functional
  └─ Deploy beta

SEMANA 5-6: IA Básica
  └─ Claude API (sugerencias actividades)
  └─ Resúmenes consolidados
  └─ Documentos validados (lectura)

SEMANA 7-8: Perfeccionamiento
  └─ Búsqueda mejorada
  └─ Feedback de actividades
  └─ Permisos granulares (backend)

SEMANA 9-10: Audio y n8n
  └─ Audio en observaciones
  └─ Webhook n8n
  └─ Whisper (transcripción)

SEMANA 11-12: Patrones Avanzados
  └─ Detección automática de patrones
  └─ Alertas inteligentes
  └─ Recomendaciones basadas en patrones

SEMANA 13-14: Pulido y Testing
  └─ QA completo
  └─ Optimización performance
  └─ Seguridad (pentest básico)

SEMANA 15-16: Deploy y Lanzamiento
  └─ Producción
  └─ Documentación
  └─ Training equipo
  └─ Launch Ecuador

```

---

## 10. STACK TECNOLÓGICO {#stack}

### Frontend
- **Framework:** React 18
- **UI Generator:** Lovable.dev (prototipado rápido)
- **Estilos:** Tailwind CSS
- **Cliente Supabase:** @supabase/supabase-js
- **Routing:** React Router v6
- **Estado:** React Context o Zustand

### Backend
- **Runtime:** Node.js 20+
- **Framework:** NestJS o Express (sin decisión aún)
- **TypeScript:** Sí (type-safe)
- **ORM:** Prisma (optional, si necesitamos queries complejas)

### Base de Datos
- **BD:** PostgreSQL (Supabase) ✅
- **Tablas:** 26 (20 existentes + 6 nuevas)
- **RLS:** Habilitado en todas las nuevas

### IA
- **Modelo:** Claude API (Sonnet 4)
- **Uso:** Sugerencias, resúmenes, patrones
- **Costo:** ~$200-500/mes a escala

### Audio y Transcripción
- **Storage:** Supabase Storage (bucket: documentos)
- **n8n:** Self-hosted o cloud
- **Whisper:** OpenAI Whisper (integrado en n8n)

### DevOps
- **Frontend Deploy:** Vercel o Netlify
- **Backend Deploy:** Railway, Render, o DigitalOcean
- **n8n:** Self-hosted en DigitalOcean o Railway
- **Monitoreo:** Sentry (errores), LogRocket (analytics)

---

## 11. KPIs DE ÉXITO {#kpis}

### Adopción
- [ ] 50 familias registradas en mes 3
- [ ] 200 familias en mes 6
- [ ] 500 familias en mes 12

### Engagement
- [ ] 70% observaciones/semana (usuarios activos)
- [ ] 3+ alertas/semana/familia promedio
- [ ] 2+ objetivos activos/niño

### Satisfacción
- [ ] NPS > 50 (neto de recomendación)
- [ ] Retencion 80% (mes 1 a mes 2)
- [ ] Duración promedio sesión > 5 minutos

### Datos
- [ ] 50k+ observaciones en mes 6
- [ ] 1000+ actividades sugeridas en banco
- [ ] 100+ documentos validados en librería

### Ingresos (Modelo a Definir)
- [ ] Versión Gratuita: 1 niño, equipo limitado
- [ ] Versión Profesional: $50/mes, ilimitado
- [ ] Versión Institucional: $200/mes, multi-familia

---

## 12. MODELO DE NEGOCIO {#negocio}

### Segmentos de Clientes

1. **Padres (B2C)** — $50/mes
   - Cuida 1-2 niños
   - Equipo pequeño
   - Motivación: Mejor coordinación

2. **Clínicas/Terapeutas (B2B)** — $500-2000/mes
   - Cuidan 20-100 niños
   - Equipo grande
   - Motivación: Eficiencia, data

3. **Escuelas/Instituciones** — $2000-5000/mes
   - Instituciones con DECEs
   - Integración con directiva
   - Motivación: Inclusión, reportes

### Propuesta de Valor
- **Para padres:** Menos ansiedad, intervenciones coordinadas
- **Para clínicos:** Data de efectividad, menos admin
- **Para escuelas:** Inclusión real, comunicación familia-escuela

### Ventaja Competitiva
- Único en Latinoamérica con este enfoque
- Multi-actor integrado desde inicio
- IA integrada (no add-on)
- Documentos médicos validados

### Roadmap de Ingresos
- **Meses 1-3:** Freemium (growth)
- **Meses 4-6:** Conversión primeros pagadores (10-20 familias)
- **Meses 7-12:** Escalado a instituciones
- **Año 2:** $50k-100k MRR (meta realista)

---

## 13. GO-TO-MARKET {#gtm)

### Fase 1: Validación (Mes 1-2)
- Cerrado beta con 10-20 familias piloto
- Feedback intenso, iteraciones rápidas
- Caso de éxito: "Conductas disminuyeron 30% en 6 semanas"

### Fase 2: Lanzamiento Local (Mes 3-4)
- Lanzamiento público en Ecuador
- Marketing: Médicos, terapeutas, escuelas (B2B2C)
- Partnerships: Asociaciones de autismo, clínicas

### Fase 3: Expansión Regional (Mes 5-12)
- Colombia, Perú, Chile
- Adaptar a normativas locales (LGPD equivalentes)
- Localizaciones: Español, traducción documentos

### Canales
- **Directo:** Website + Google Ads
- **Partnerships:** Médicos, terapeutas (comisión 20%)
- **Institucional:** Venta directa a escuelas/clínicas
- **Comunidad:** Asociaciones autismo, redes padres

---

## 14. STATUS ACTUAL {#status}

### ✅ COMPLETADO

**Supabase (100% listo):**
- ✅ 6 tablas nuevas creadas
- ✅ 14 campos agregados a tablas existentes
- ✅ RLS habilitado
- ✅ Índices agregados
- ✅ Bucket `documentos` disponible
- ✅ Credenciales guardadas

**Documentación:**
- ✅ Documento maestro (este)
- ✅ Análisis de gaps
- ✅ Prompt para Lovable (listo)
- ✅ SQL personalizado (ejecutado)
- ✅ Guías paso a paso

### 🚀 PRÓXIMO (SEMANAS 1-2)

**Lovable.dev:**
- [ ] Generar 12 pantallas UI/UX
- [ ] Conectar con Supabase automáticamente
- [ ] Testing básico (login, registrar observación)

**Backend Scaffolding:**
- [ ] Setup Node.js/NestJS
- [ ] CRUD observaciones
- [ ] RLS functional tests

### 📅 TIMELINE REALISTA

```
AHORA (Semana 1):     Lovable + Backend scaffolding
SEMANA 3:            MVP Core (observaciones + alertas)
SEMANA 6:            IA Básica (sugerencias, resúmenes)
SEMANA 9:            Audio (n8n + Whisper)
SEMANA 12:           Patrones avanzados
SEMANA 14:           QA y Deploy
SEMANA 16:           Launch Ecuador
```

---

## ANEXO: Preguntas Clave Pendientes de Responder

1. **Backend:** ¿NestJS o Express? (Recomendación: NestJS para escala)
2. **Hosting:** ¿Railway o DigitalOcean? (Recomendación: Railway para MVP)
3. **IA:** ¿Claude API cloud o fine-tune? (Recomendación: Cloud inicialmente)
4. **Equipo:** ¿Desarrollador fullstack? ¿Frontend? ¿DevOps? (Actual: Tú + yo)
5. **Budget:** ¿Inversión en infraestructura/servicios? (Estimado: $500-1000/mes)
6. **Documento:** ¿Cuántos PDFs/videos médicos validados? (Necesario: 50-100 para MVP)

---

## CONCLUSIÓN

**mIAngel está estratégicamente posicionado como el único sistema de coordinación terapéutica integrada en Latinoamérica.**

Con:
- ✅ Base de datos robusta (26 tablas, RLS, IA-ready)
- ✅ Modelo de datos pensado para multi-actor
- ✅ IA integrada desde diseño
- ✅ Documentación completa
- ✅ Timeline realista (16 semanas para MVP)

**Estamos listos para entrar a fase de desarrollo.**

El siguiente paso: **Generar interfaz en Lovable** y comenzar con backend.

---

**Versión:** 2.0 ACTUALIZADA  
**Fecha:** Abril 2026  
**Estado:** Supabase ✅ | Documentación ✅ | Arquitectura ✅  
**Próximo:** Lovable + Backend