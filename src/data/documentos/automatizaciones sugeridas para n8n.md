# n8n: 11 AUTOMATIZACIONES FINALES - mIAngel MVP

**Versión:** Final  
**Descartados:** Workflows 1, 5, 9, 10, 17, 18, 19  
**Implementar:** 11 workflows seleccionados  
**Fecha:** Abril 2026  

---

## TABLA DE CONTENIDOS

1. [Los 11 Workflows Finales](#11-workflows)
2. [Matriz Comparativa](#matriz)
3. [Orden de Implementación](#orden)
4. [Detalles Técnicos](#detalles)
5. [Timeline y Costos](#timeline)
6. [Checklist](#checklist)

---

## LOS 11 WORKFLOWS FINALES {#11-workflows}

### ✅ MANTIENEN (Seleccionados)

| # | Nombre | Disparador | Frecuencia | Prioridad | Fase |
|---|--------|-----------|-----------|-----------|------|
| **2** | Alerta Inmediata (5/5) | Observación intensidad 5 | Instantáneo | ⭐⭐⭐⭐⭐ | MVP |
| **3** | Sugerir Actividad | Nueva observación | Al registrar | ⭐⭐⭐⭐⭐ | MVP |
| **4** | Resumen Diario | 9 PM (cron) | Diario | ⭐⭐⭐⭐ | MVP |
| **6** | Detectar Patrones | Cron cada 6h | Cada 6h | ⭐⭐⭐⭐⭐ | Fase 2 |
| **7** | Ingesta Documentos | PDF subido | Al subir | ⭐⭐⭐⭐⭐ | MVP |
| **8** | Invitar Equipo | Padre agrega miembro | Instantáneo | ⭐⭐⭐⭐⭐ | MVP |
| **11** | Análisis Sentimiento | Nueva observación | Al registrar | ⭐⭐⭐ | Fase 2 |
| **12** | Recordatorio Objetivo | Cron cada 3 días | Cada 3 días | ⭐⭐⭐ | Fase 2 |
| **13** | Export Google Sheets | Cron mes 1ro | Mensual | ⭐⭐ | Fase 3 |
| **14** | Agendar Recordatorio | Padre crea observación | Al registrar | ⭐⭐ | Fase 3 |
| **15** | Escalada Conducta | Cron diario 12 PM | Diario | ⭐⭐⭐⭐ | Fase 2 |

---

### ❌ DESCARTADOS (Por ahora)

| # | Nombre | Razón |
|---|--------|-------|
| **1** | Transcribir Audio | Fase posterior (Whisper es extra) |
| **5** | Resumen Semanal | MVP no necesita semanal (diario suficiente) |
| **9** | Reporte Mensual PDF | PDF es profesional pero no crítico MVP |
| **10** | Slack Notifications | Equipo pequeño, no necesario |
| **17** | Google Sheets Sync | Excel/Sheets es secundario |
| **18** | Agendar Recordatorio | Google Calendar integración extra |
| **19** | (Número vacío) | N/A |

---

## MATRIZ COMPARATIVA {#matriz}

### Comparación: Antes vs Después

```
ANTES:
  Total workflows: 20
  Costo: $44-94/mes
  Tiempo implementación: 40 horas
  Complejidad promedio: ⭐⭐⭐

DESPUÉS:
  Total workflows: 11
  Costo: $25-45/mes
  Tiempo implementación: 20 horas
  Complejidad promedio: ⭐⭐

AHORRO:
  - 9 workflows eliminados
  - $19-49/mes reducido
  - 20 horas de desarrollo
  - Enfoque MVP más claro
```

---

## ORDEN DE IMPLEMENTACIÓN {#orden}

### FASE 1: MVP CRÍTICO (Semana 3-4) - 8 horas

**Imprescindibles para lanzar MVP:**

#### WORKFLOW 2: Alerta Inmediata (5/5) ⭐⭐⭐⭐⭐
```
Tiempo: 2 horas
Costo: Gratis (email)
Disparador: Observación con intensidad_escala = 5
Acción: Email inmediato a equipo PAI

NODOS CRÍTICOS:
  1. Webhook Supabase (observaciones)
     └─ Filtro: intensidad_escala = 5

  2. Fetch Team (equipo_pai)
     └─ Get médicos + terapeutas

  3. Email (SendGrid)
     └─ Subject: "⚠️ ALERTA: Conducta crítica"
     └─ To: [médico, terapeuta, educador]

BENEFICIO: Respuesta < 1 minuto a conductas críticas
IMPRESCINDIBLE: SÍ - Seguridad del niño
```

---

#### WORKFLOW 8: Invitar Equipo ⭐⭐⭐⭐⭐
```
Tiempo: 2 horas
Costo: Gratis (email)
Disparador: Padre agrega nuevo miembro
Acción: Enviar código de verificación

NODOS CRÍTICOS:
  1. Webhook Supabase (equipo_pai INSERT)
  2. Generate Code (random 8 chars)
  3. Update equipo_pai (guardar código)
  4. Email (SendGrid)
     └─ Subject: "Invitación mIAngel - [rol]"
     └─ Include code + verification link

BENEFICIO: Onboarding seguro sin compartir contraseña
IMPRESCINDIBLE: SÍ - Flujo de registro core
```

---

#### WORKFLOW 7: Ingesta Documentos ⭐⭐⭐⭐⭐
```
Tiempo: 3 horas
Costo: $1-3/mes (OpenAI embeddings)
Disparador: PDF subido a Storage
Acción: Extraer texto, crear embeddings, indexar

NODOS CRÍTICOS:
  1. Webhook Supabase Storage (documentos_medicos)
  2. Download File (PDF)
  3. Extract Text (pdfjs)
  4. Chunk Text (500 chars + overlap)
  5. Generate Embeddings (OpenAI)
     └─ text-embedding-3-small
  6. Insert into Supabase (documents table)
     ├─ content: chunk
     ├─ embedding: vector(1536)
     └─ metadata: {filename, familia_id, etc}
  7. Email confirmation

BENEFICIO: Documentos médicos listos para RAG
IMPRESCINDIBLE: SÍ - Core del sistema IA
```

---

#### WORKFLOW 3: Sugerir Actividad ⭐⭐⭐⭐⭐
```
Tiempo: 4 horas (más complejo por RAG)
Costo: $0.002-0.01/sugerencia (Claude)
Disparador: Nueva observación
Acción: Claude sugiere actividad basada en:
  - Observación del niño
  - Documentos médicos (vector search)
  - Objetivos activos

NODOS CRÍTICOS:
  1. Webhook Supabase (observaciones INSERT)
  
  2. Vector Search (Supabase)
     └─ Query tabla documents con embedding
     └─ Top 5 documentos relevantes
  
  3. Fetch PAI Goals (activos)
  
  4. Claude API (Sonnet)
     └─ Prompt:
        "Observación: ${descripcion}
         Documentos: ${top_5_docs}
         Objetivos: ${active_goals}
         
         Sugiere 1-2 actividades específicas"
  
  5. Parse Response
  
  6. Insert Suggested Activities
     └─ Tabla: actividades_sugeridas
  
  7. Notify Parent (opcional)

BENEFICIO: Recomendaciones IA contextuadas
IMPRESCINDIBLE: SÍ - Diferenciador core
```

---

#### WORKFLOW 4: Resumen Diario ⭐⭐⭐⭐
```
Tiempo: 2 horas
Costo: $0.001-0.003/familia (Claude)
Disparador: Cron 9 PM (0 21 * * *)
Acción: Email resumen del día a padre

NODOS CRÍTICOS:
  1. Cron Trigger (21:00)
  
  2. Loop All Families
     └─ Filter: tiene observaciones hoy
  
  3. Fetch Today's Observations
     └─ WHERE: created_at = TODAY
  
  4. Claude - Generate Summary
     └─ Prompt: "Resume estas observaciones"
  
  5. Format HTML Email
     ├─ Resumen (1 párrafo)
     ├─ Comportamientos (bullets)
     ├─ Emociones detectadas
     └─ Recomendación
  
  6. Send Email

BENEFICIO: Padre recibe insights diarios
IMPRESCINDIBLE: SÍ - Engagement y valor
```

---

**TOTAL FASE 1: 8 horas, $1-5/mes**

---

### FASE 2: IA AVANZADA (Semana 5-6) - 8 horas

#### WORKFLOW 6: Detectar Patrones ⭐⭐⭐⭐⭐
```
Tiempo: 4 horas
Costo: $0.005-0.02/ejecución (Claude)
Disparador: Cron cada 6 horas (0 */6 * * *)
Acción: Analizar patrones últimas 72h

NODOS:
  1. Cron Trigger (cada 6h)
  
  2. Loop All Families
  
  3. Fetch Last 72h Observations
  
  4. Claude - Pattern Analysis
     └─ JSON output:
        {
          "patrones": ["patrón1", "patrón2"],
          "hora_pico": "HH:MM",
          "contexto_desencadenante": "...",
          "es_anormal": true/false,
          "confianza": "alta/media/baja"
        }
  
  5. Check if Abnormal
     └─ IF es_anormal AND confianza=alta
        └─ SEND ALERT TO DOCTOR
  
  6. Insert Pattern Record
     └─ Tabla: patrones_detectados

BENEFICIO: Médico notificado automáticamente
IMPRESCINDIBLE: SÍ - Data-driven decisions
```

---

#### WORKFLOW 15: Escalada Conducta ⭐⭐⭐⭐
```
Tiempo: 3 horas
Costo: $0.001-0.005 (Claude)
Disparador: Cron diario 12 PM (0 12 * * *)
Acción: Detectar escalada (5+ días agresivo)

NODOS:
  1. Cron Trigger (12:00)
  
  2. Loop All Families
  
  3. Fetch Last 7 Days (conducta agresiva)
     └─ Filter: tipo='comportamiento' AND agresivo
     └─ Count: >= 5?
  
  4. IF count >= 5:
     └─ Claude Assessment
     
  5. Send Alert to Doctor
     └─ Email: "Escalada detectada"

BENEFICIO: Médico alerta a escaladas
IMPRESCINDIBLE: SÍ - Seguridad
```

---

#### WORKFLOW 11: Análisis Sentimiento ⭐⭐⭐
```
Tiempo: 1 hora
Costo: $0.001-0.003 (Claude)
Disparador: Nueva observación
Acción: Analizar emociones

NODOS:
  1. Webhook (observaciones INSERT)
  
  2. Claude - Sentiment Analysis
     └─ JSON: {sentimiento, emociones, confianza}
  
  3. Update Observation
     └─ sentimiento field
  
BENEFICIO: UI muestra emociones
IMPRESCINDIBLE: NO (pero enhance UX)
```

---

#### WORKFLOW 12: Recordatorio Objetivo ⭐⭐⭐
```
Tiempo: 1 hora
Costo: Gratis (email)
Disparador: Cron diario (0 9 * * *)
Acción: Email si objetivo sin actividad 3+ días

NODOS:
  1. Cron Trigger (09:00)
  
  2. Fetch Active Objectives
     └─ Filter: sin actividad >= 3 días
  
  3. Format Email
     └─ "Recuerda tu objetivo: ${objetivo}"
  
  4. Send Email

BENEFICIO: Mantiene objetivos activos
IMPRESCINDIBLE: NO (engagement)
```

---

**TOTAL FASE 2: 8 horas, $10-25/mes**

---

### FASE 3: INTEGRACIONES (Semana 7-8) - 4 horas

#### WORKFLOW 13: Export Google Sheets ⭐⭐
```
Tiempo: 2 horas
Costo: Gratis
Disparador: Cron mes 1ro (0 10 1 * *)
Acción: Exporta observaciones a Google Sheet

NODOS:
  1. Cron (1ero mes 10:00)
  
  2. Loop Families
  
  3. Fetch Month Data
  
  4. Transform to Sheet Format
  
  5. Check if Sheet Exists
     └─ IF no: Create new
     └─ IF yes: Clear + Update
  
  6. Append Data (Google Sheets API)
  
  7. Format Sheet (headers, colors)
  
  8. Send Email with Link

BENEFICIO: Datos en Excel para análisis
IMPRESCINDIBLE: NO (opcional)
```

---

#### WORKFLOW 14: Agendar Recordatorio ⭐⭐
```
Tiempo: 2 horas
Costo: Gratis
Disparador: Observación con debe_recordatorio=true
Acción: Crea evento en Google Calendar

NODOS:
  1. Webhook (observaciones)
     └─ Filter: debe_recordatorio=true
  
  2. Check User Preference
     └─ calendario_conectado?
  
  3. Create Calendar Event (Google Calendar API)
     └─ Title: "Recordatorio: [descripción]"
     └─ Start: mañana 9 AM
     └─ Reminder: 1 hour before
  
  4. Save Event ID
  
  5. Log

BENEFICIO: Recordatorios en Google Calendar
IMPRESCINDIBLE: NO (nice-to-have)
```

---

**TOTAL FASE 3: 4 horas, Gratis**

---

## DETALLES TÉCNICOS {#detalles}

### DEPENDENCIAS POR WORKFLOW

```
WORKFLOW 2 (Alerta)
  ├─ Supabase: observaciones table
  ├─ Supabase: equipo_pai table
  └─ Email: SendGrid/Gmail

WORKFLOW 3 (Sugerir Actividad)
  ├─ Supabase: observaciones, pai_goals, documents
  ├─ Vector Search: pgvector
  ├─ Claude API: Sonnet 4
  └─ Supabase: actividades_sugeridas table

WORKFLOW 4 (Resumen Diario)
  ├─ Supabase: observaciones, familias
  ├─ Claude API: Sonnet 4
  └─ Email: SendGrid/Gmail

WORKFLOW 6 (Detectar Patrones)
  ├─ Supabase: observaciones, patrones_detectados
  ├─ Claude API: Sonnet 4
  └─ Email: opcional

WORKFLOW 7 (Ingesta Documentos)
  ├─ Supabase Storage: documentos_medicos
  ├─ PDF extraction: pdfjs
  ├─ OpenAI: Embeddings (text-embedding-3-small)
  ├─ Supabase: documents table
  └─ Email: confirmación

WORKFLOW 8 (Invitar Equipo)
  ├─ Supabase: equipo_pai table
  ├─ Code generation: random string
  └─ Email: SendGrid/Gmail

WORKFLOW 11 (Sentimiento)
  ├─ Supabase: observaciones
  ├─ Claude API: Sonnet 4
  └─ Supabase: update observaciones

WORKFLOW 12 (Recordatorio)
  ├─ Supabase: pai_goals, observaciones
  └─ Email: SendGrid/Gmail

WORKFLOW 13 (Google Sheets)
  ├─ Supabase: observaciones
  ├─ Google Sheets API: access token
  └─ Email: confirmación

WORKFLOW 14 (Google Calendar)
  ├─ Supabase: observaciones
  ├─ Google Calendar API: access token
  └─ Supabase: observaciones update

WORKFLOW 15 (Escalada)
  ├─ Supabase: observaciones, escaladas_detectadas
  ├─ Claude API: Sonnet 4
  └─ Email: médico
```

---

## TIMELINE Y COSTOS {#timeline}

### DESGLOSE FINAL

```
FASE 1 (MVP CRÍTICO) - Semana 3-4
  ├─ Workflow 2: Alerta Inmediata         2h  Gratis
  ├─ Workflow 8: Invitar Equipo           2h  Gratis
  ├─ Workflow 7: Ingesta Documentos       3h  $1-3/mes
  └─ Workflow 4: Resumen Diario           2h  $1-3/mes
  └─ SUBTOTAL: 9h, $2-6/mes

FASE 2 (IA AVANZADA) - Semana 5-6
  ├─ Workflow 3: Sugerir Actividad        4h  $5-10/mes
  ├─ Workflow 6: Detectar Patrones        4h  $5-15/mes
  ├─ Workflow 15: Escalada Conducta       3h  $1-3/mes
  ├─ Workflow 11: Sentimiento             1h  $0.5-1/mes
  └─ Workflow 12: Recordatorio            1h  Gratis
  └─ SUBTOTAL: 13h, $11.5-29/mes

FASE 3 (INTEGRACIONES) - Semana 7-8
  ├─ Workflow 13: Google Sheets           2h  Gratis
  └─ Workflow 14: Google Calendar         2h  Gratis
  └─ SUBTOTAL: 4h, Gratis

─────────────────────────────────────
TOTAL: 26 horas, $13.5-35/mes
```

### COSTO POR FAMILIA

```
Asumiendo 100 familias activas:

Costo total/mes: $13.5-35
Costo/familia: $0.135-0.35/familia/mes

Si cobras: $15/mes
  ROI: 43-111x

Si cobras: $10/mes
  ROI: 29-74x
```

### Comparación Antes vs Después

```
                ANTES         DESPUÉS       AHORRO
────────────────────────────────────────────────────
Workflows       20            11            9 (-45%)
Horas           40            26            14 (-35%)
Costo/mes       $44-94        $13.5-35      $30.5-79 (-45%)
Complejidad     ⭐⭐⭐         ⭐⭐          -1 nivel
```

---

## CHECKLIST DE IMPLEMENTACIÓN {#checklist}

### PRE-REQUISITOS (Valida esto primero)

```
SUPABASE:
  [ ] Tabla observaciones creada
  [ ] Tabla documents creada (para embeddings)
  [ ] Tabla equipo_pai creada (con campos de verificación)
  [ ] Tabla pai_goals creada
  [ ] Tabla patrones_detectados creada
  [ ] Tabla escaladas_detectadas creada (opcional)
  [ ] Tabla actividades_sugeridas creada
  [ ] Bucket documentos_medicos creado
  [ ] RLS habilitado en tablas nuevas
  [ ] Índices pgvector creados

CREDENCIALES GUARDADAS:
  [ ] SUPABASE_URL
  [ ] SUPABASE_ANON_KEY
  [ ] SUPABASE_SERVICE_KEY
  [ ] ANTHROPIC_API_KEY
  [ ] OPENAI_API_KEY (para embeddings)
  [ ] SENDGRID_API_KEY (o Gmail)
  [ ] GOOGLE_SHEETS_API (si usas sheet)
  [ ] GOOGLE_CALENDAR_API (si usas calendar)
```

---

### FASE 1: MVP CRÍTICO (3-4 días)

**DÍA 1:**
- [ ] Workflow 2: Alerta Inmediata
  - [ ] Crear webhook en n8n
  - [ ] Conectar Supabase
  - [ ] Configurar email
  - [ ] Probar con observación intensidad=5
  - [ ] ✅ Alerta recibida en <1 min

- [ ] Workflow 8: Invitar Equipo
  - [ ] Crear webhook (equipo_pai INSERT)
  - [ ] Generar código aleatorio
  - [ ] Formatear email
  - [ ] Probar con nuevo miembro
  - [ ] ✅ Email con código recibido

**DÍA 2:**
- [ ] Workflow 7: Ingesta Documentos
  - [ ] Crear webhook (Storage PDF)
  - [ ] Implementar extracción PDF
  - [ ] Generar embeddings
  - [ ] Insertar en tabla documents
  - [ ] Probar con PDF médico
  - [ ] ✅ Documento searchable

**DÍA 3:**
- [ ] Workflow 4: Resumen Diario
  - [ ] Crear cron (9 PM)
  - [ ] Fetch observaciones del día
  - [ ] Claude generador resumen
  - [ ] Formatear email HTML
  - [ ] Probar manualmente (trigger)
  - [ ] ✅ Email resumen recibido

---

### FASE 2: IA AVANZADA (4-5 días)

**DÍA 4:**
- [ ] Workflow 3: Sugerir Actividad
  - [ ] Webhook (nueva observación)
  - [ ] Vector search en documents
  - [ ] Fetch objetivos activos
  - [ ] Claude prompt (sugerencias)
  - [ ] Insertar actividades_sugeridas
  - [ ] Probar con observación
  - [ ] ✅ Actividad sugerida aparece

**DÍA 5:**
- [ ] Workflow 6: Detectar Patrones
  - [ ] Cron cada 6 horas
  - [ ] Fetch últimas 72h
  - [ ] Claude pattern analysis
  - [ ] Si anormal → Alert doctor
  - [ ] Insertar patrones_detectados
  - [ ] Probar con múltiples obs
  - [ ] ✅ Patrón detectado y guardado

- [ ] Workflow 15: Escalada Conducta
  - [ ] Cron diario 12 PM
  - [ ] Fetch 7 días (agresivo)
  - [ ] Count >= 5?
  - [ ] Claude assessment
  - [ ] Email alert doctor
  - [ ] ✅ Alerta enviada

**DÍA 6:**
- [ ] Workflow 11: Sentimiento
  - [ ] Webhook (nueva obs)
  - [ ] Claude sentiment analysis
  - [ ] Update observaciones
  - [ ] Probar
  - [ ] ✅ Sentimiento guardado

- [ ] Workflow 12: Recordatorio
  - [ ] Cron cada 3 días
  - [ ] Fetch objetivos sin actividad
  - [ ] Email recordatorio
  - [ ] Probar
  - [ ] ✅ Email recordatorio

---

### FASE 3: INTEGRACIONES (2 días)

**DÍA 7:**
- [ ] Workflow 13: Google Sheets
  - [ ] Cron mes 1ro
  - [ ] Fetch observaciones
  - [ ] Google Sheets API
  - [ ] Create/Update sheet
  - [ ] Format + Share
  - [ ] ✅ Sheet disponible

**DÍA 8:**
- [ ] Workflow 14: Google Calendar
  - [ ] Webhook (obs INSERT)
  - [ ] Google Calendar API
  - [ ] Create event
  - [ ] Save event_id
  - [ ] ✅ Evento en calendario

---

### VALIDACIÓN FINAL

```
PRUEBAS:
  [ ] Padre registra observación
    └─ ✅ Sentimiento detectado
    └─ ✅ Actividad sugerida
    └─ ✅ En eventualmente: Alerta diaria 9 PM

  [ ] Padre sube PDF médico
    └─ ✅ Documento indexado
    └─ ✅ Searchable en sugerencias

  [ ] Padre agrega médico
    └─ ✅ Email con código
    └─ ✅ Código funciona

  [ ] Sistema ejecuta automáticamente
    └─ ✅ Patrones detectados cada 6h
    └─ ✅ Escalada detectada cada 12h
    └─ ✅ Recordatorio objetivo cada 3 días
    └─ ✅ Resumen diario 9 PM

  [ ] Datos exportan correctamente
    └─ ✅ Google Sheets mensual
    └─ ✅ Google Calendar eventos

PERFORMANCE:
  [ ] Workflow 2 (Alerta): < 5 segundos
  [ ] Workflow 3 (Sugerencia): < 30 segundos
  [ ] Workflow 4 (Resumen): < 2 segundos/familia
  [ ] Workflow 6 (Patrones): < 20 segundos
  [ ] Workflow 7 (Documentos): < 60 segundos
```

---

## RESUMEN FINAL

```
┌─────────────────────────────────────────────┐
│  11 WORKFLOWS n8n - MVP FINAL              │
├─────────────────────────────────────────────┤
│                                             │
│  IMPLEMENTACIÓN:                            │
│  ├─ Fase 1 (MVP): 4 workflows - 9h         │
│  ├─ Fase 2 (IA): 5 workflows - 13h         │
│  └─ Fase 3 (Integraciones): 2 workflows-4h │
│                                             │
│  TOTAL: 26 horas de desarrollo             │
│                                             │
│  COSTO:                                     │
│  ├─ Fase 1: $2-6/mes                       │
│  ├─ Fase 2: $11.5-29/mes                   │
│  └─ Fase 3: Gratis                         │
│  ├─ TOTAL: $13.5-35/mes                    │
│                                             │
│  BENEFICIOS:                                │
│  ✅ Sistema completamente automatizado      │
│  ✅ IA integrada en cada paso               │
│  ✅ Documentos médicos indexados            │
│  ✅ Alertas en tiempo real                  │
│  ✅ Patrones automáticos                    │
│  ✅ Resúmenes diarios                       │
│  ✅ Escalables sin límites                  │
│                                             │
│  IMPRESCINDIBLES (Semana 3-4):             │
│  1. Workflow 2: Alerta Inmediata           │
│  2. Workflow 8: Invitar Equipo             │
│  3. Workflow 7: Ingesta Documentos         │
│  4. Workflow 4: Resumen Diario             │
│  + Workflow 3: Sugerir Actividad (pronto)  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## PRÓXIMOS PASOS

### Esta Semana:
1. [ ] Validar pre-requisitos Supabase
2. [ ] Guardar credenciales en `.env`
3. [ ] Crear n8n account si no tienes

### Semana 3-4:
1. [ ] Implementar Fase 1 (4 workflows)
2. [ ] Probar con 2-3 familias piloto
3. [ ] Validar que funcionan correctamente

### Semana 5-6:
1. [ ] Implementar Fase 2 (5 workflows)
2. [ ] Expandir a 5-10 familias
3. [ ] Recopila feedback

### Semana 7-8:
1. [ ] Implementar Fase 3 (2 workflows)
2. [ ] Pulir basado en feedback
3. [ ] Prepara para escala

---

**¿Comenzamos con Workflow 2 (Alerta Inmediata)?**
