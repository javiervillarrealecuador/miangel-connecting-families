# 🤖 Posibles Automatizaciones de n8n - mIAngel

Este documento detalla los 11 flujos de trabajo (workflows) seleccionados para optimizar la coordinación terapéutica y la inteligencia del sistema mIAngel utilizando n8n.

---

## 🚀 Fase 1: MVP Crítico (Fundación)
*Enfoque: Seguridad del niño y onboarding del equipo.*

### 1. Alerta Inmediata (Intensidad 5/5)
- **Disparador:** Nueva observación con `intensidad_escala` = 5.
- **Acción:** Envío inmediato de email a todo el equipo PAI (médicos, terapeutas, educadores).
- **Prioridad:** ⭐⭐⭐⭐⭐

### 2. Invitar Equipo
- **Disparador:** Padre agrega un nuevo miembro en la app.
- **Acción:** Generación de código aleatorio y envío de email de invitación con link de registro.
- **Prioridad:** ⭐⭐⭐⭐⭐

### 3. Ingesta de Documentos
- **Disparador:** Subida de PDF al storage de documentos médicos.
- **Acción:** Extracción de texto, generación de embeddings (OpenAI) e inserción en base de datos vectorial para RAG.
- **Prioridad:** ⭐⭐⭐⭐⭐

### 4. Resumen Diario
- **Disparador:** Cron job a las 9 PM (21:00).
- **Acción:** Claude analiza las observaciones del día y envía un resumen estructurado por email a los padres.
- **Prioridad:** ⭐⭐⭐⭐

---

## 🧠 Fase 2: IA Avanzada e Insights
*Enfoque: Análisis de datos y recomendaciones personalizadas.*

### 5. Sugerir Actividad (RAG - Fase 2)
- **Disparador:** Webhook desde la App (POST).
- **Entradas:** `contexto` (lugar), `objetivo_id` (meta seleccionada), `child_id`.
- **Lógica n8n:**
  1. **Fetch DB:** Consulta en Supabase el detalle del objetivo (`pai_goals`) y las últimas 5 observaciones del niño para entender su estado emocional reciente.
  2. **Vector Search:** Busca en la tabla `documentos_validados` (usando embeddings) actividades que coincidan con el `contexto` (ej: "parque") y el área del objetivo (ej: "Social").
  3. **IA Reasoning (Claude):** Procesa: "El niño está en [LUGAR], queremos trabajar [META]. Sus últimas observaciones dicen [HISTORIAL]. De estas actividades [RESULTADOS BUSQUEDA], ¿cuál recomiendas y por qué?".
  4. **Respuesta:** Devuelve un JSON con la actividad recomendada y un campo `aiReasoning` para mostrar en la App.
- **Prioridad:** ⭐⭐⭐⭐⭐

### 6. Detectar Patrones
- **Disparador:** Cron job cada 6 horas.
- **Acción:** Análisis de las últimas 72 horas de datos para detectar comportamientos inusuales o mejoras significativas.
- **Prioridad:** ⭐⭐⭐⭐⭐

### 7. Análisis de Sentimiento
- **Disparador:** Nueva observación registrada.
- **Acción:** Procesamiento del texto con IA para clasificar emociones y sentimientos predominantes.
- **Prioridad:** ⭐⭐⭐

### 8. Recordatorio de Objetivo
- **Disparador:** Cron job cada 3 días.
- **Acción:** Identifica objetivos del PAI sin actividad reciente y envía un recordatorio motivador.
- **Prioridad:** ⭐⭐⭐

### 9. Escalada de Conducta
- **Disparador:** Cron job diario (12 PM).
- **Acción:** Alerta al médico si se detectan 5 o más días consecutivos de conductas agresivas o regresiones.
- **Prioridad:** ⭐⭐⭐⭐

---

## 📅 Fase 3: Integraciones de Valor
*Enfoque: Exportación de datos y gestión de tiempo.*

### 10. Exportación a Google Sheets
- **Disparador:** El día 1 de cada mes.
- **Acción:** Sincronización de todas las observaciones mensuales en una hoja de cálculo para el historial médico externo.
- **Prioridad:** ⭐⭐

### 11. Agendar Recordatorio (Calendar)
- **Disparador:** Observación marcada con "debe recordatorio".
- **Acción:** Creación automática de un evento en Google Calendar para seguimiento médico.
- **Prioridad:** ⭐⭐

---

## 📊 Resumen Técnico
- **Motor:** n8n (Self-hosted o Cloud).
- **Modelos IA:** Claude API (Sonnet) + Whisper (Audio) + OpenAI Embeddings.
- **Conectores:** Supabase (Webhooks/DB), SendGrid/Resend (Email), Google Workspace.

*Documento creado el 7 de mayo de 2026.*
