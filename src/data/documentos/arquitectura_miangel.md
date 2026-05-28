# 🏗️ Arquitectura del Sistema: mIAngel
**Versión:** 2.1 (Mobile-First Premium)  
**Última Actualización:** 27 de Mayo de 2026 (Consolidación IA Real & Corrección de Reportes)

Este documento describe la estructura técnica, la base de datos y la evolución de mIAngel para facilitar el mantenimiento y la escalabilidad del proyecto.

---

## 1. 📊 Estructura de la Base de Datos (Supabase)

La aplicación utiliza Supabase como backend (PostgreSQL), centrada en un modelo relacional que prioriza la seguridad de los datos clínicos (RLS) y la trazabilidad.

### Tablas Principales:

| Tabla | Propósito | Campos Clave |
| :--- | :--- | :--- |
| `familias` | Entidad raíz que agrupa a los miembros. | `id`, `nombre_familia`, `created_at` |
| `personas_autismo` | Perfil clínico completo (Ficha PAI). Contiene 84+ campos. | `id`, `full_name`, `sensorial_*`, `motor_*`, `educacion`, `salud` |
| `equipo_pai` | Relaciona usuarios con familias y define permisos. | `user_id`, `familia_id`, `rol`, `puede_crear_observaciones` |
| `observaciones` | Registro de conductas, sentimientos y evidencias diarias. | `id`, `tipo`, `descripcion_texto`, `intensidad_escala`, `sentimiento` |
| `pai_goals` | Metas terapéuticas del Plan de Acción Integral. | `id`, `title`, `progress`, `status` (in_progress, completed) |
| `goal_observations` | La "unión vital". Vincula observaciones con metas. | `goal_id`, `observacion_id`, `impacto_porcentaje` (Escala 1-10) |
| `alertas` | Sistema de notificaciones críticas basadas en intensidad. | `tipo`, `severidad` (critica, alta, normal), `leida_por` |
| `resumenes_consolidados` | Consolidación y síntesis de observaciones semanales/mensuales vía IA. | `id`, `persona_autismo_id`, `familia_id`, `resumen_texto`, `tendencia`, `created_at` |
| `invitaciones_equipo` | Gestión de onboarding para nuevos terapeutas/familiares. | `email`, `token`, `rol_asignado`, `estado` |

---

## 2. 🔗 Relaciones y Lógica de Negocio

### El "Motor Terapéutico":
1. **Jerarquía**: Una `familia` puede tener una o más `personas_autismo`.
2. **Acceso**: El `equipo_pai` es el puente. Un usuario solo puede ver datos si su `user_id` está vinculado a la `familia_id` correspondiente.
3. **Flujo de Progreso**:
   - Se crea una `observacion`.
   - Si se vincula a un `pai_goal`, se registra en `goal_observations`.
   - El `impacto_porcentaje` (1-10) de la observación suma o resta automáticamente al `progress` de la tabla `pai_goals`.
4. **Sistema de Alertas**: Si una `observacion` tiene `intensidad_escala` >= 4, el sistema inserta automáticamente un registro en `alertas`.

---

## 3. 🛠️ Stack Tecnológico

- **Frontend:** React + Vite (Typescript).
- **Styling:** TailwindCSS (Sistema de diseño "Absolute Responsive" con Glassmorphism).
- **Backend/DB:** Supabase (Auth, PostgreSQL, Realtime, Storage).
- **Automatización:** n8n (Orquestación de flujos y procesos background).
- **IA:** Gemini API (`gemini-1.5-flash` en frontend / backend a través del SDK `@google/generative-ai`) para consolidación de reportes y generación de actividades sugeridas de respaldo.
- **Iconografía:** Lucide React (Premium stroke).
- **Notificaciones:** Sonner (Toast interactivos) + Resend (Email).

---

## 4. ⏳ Proceso Histórico de Desarrollo

### Fase 1: El Cimiento Clínico (Abril 2026)
- Definición de la **Ficha PAI Integral**. Se identificaron los 84 campos necesarios para un seguimiento profesional (Sensorial, Motor, Adaptativo, etc.).
- Configuración inicial de Supabase y esquemas relacionales.

### Fase 2: Gestión de Equipos y Colaboración
- Implementación de la tabla `equipo_pai`.
- Creación del sistema de invitaciones por correo para que terapeutas y familiares puedan compartir un mismo perfil.

### Fase 3: Inteligencia y Trazabilidad
- Creación de la tabla `goal_observations`.
- Implementación de la **Escala de Impacto 1-10** para que las observaciones diarias muevan el progreso de las metas de forma matemática y no solo subjetiva.

### Fase 4: Refactor "Absolute Responsive" y Consolidación IA Real (Mayo 2026)
- **Diseño Premium**: Implementación de Glassmorphism, tipografía de alto contraste y micro-animaciones.
- **Mobile-First**: Reestructuración de todas las páginas para ser 100% táctiles y ergonómicas en Android e iOS.
- **Corrección de Reportes**: Se solucionó un bug crítico en `ReportsPage.tsx` donde se realizaban consultas ordenadas por una columna inexistente (`fecha_generacion` en lugar de la columna real de Supabase `created_at`).
- **Consolidación Clínica Real con Gemini**: Se implementó una lógica directa utilizando el modelo `gemini-1.5-flash` que consume las últimas 30 observaciones clínicas reales de Supabase, analiza el comportamiento del niño y genera un reporte JSON estructurado con el resumen, la tendencia evolutiva, cambios de comportamiento y recomendaciones prácticas. Éste se guarda automáticamente en `resumenes_consolidados`.
- **Preparación de Despliegue**: Se añadieron archivos de configuración de enrutamiento SPA (`vercel.json` y `public/_redirects`) para evitar errores 404 al recargar páginas, y se protegió el archivo `.env` en `.gitignore` para evitar la fuga accidental de llaves de API.

---

## 5. 🤖 Capa de Automatización e IA (n8n)

mIAngel utiliza **n8n** como motor de orquestación para procesos asíncronos y análisis inteligente, conectando la base de datos con modelos de lenguaje avanzado.

### Inventario de Workflows:

| Fase | Nombre del Workflow | Descripción | Disparador |
| :--- | :--- | :--- | :--- |
| **IA** | Sugerir Actividad (F2) | Orquestación RAG (Lugar + Objetivo PAI). | Webhook (App) |
| **MVP** | Alerta Inmediata | Email crítico al equipo médico. | Intensidad = 5 |
| **MVP** | Invitar Equipo | Gestión de códigos de verificación. | Insert `equipo_pai` |
| **MVP** | Ingesta Documentos | Indexación vectorial de PDFs médicos. | Upload Storage |
| **MVP** | Resumen Diario | Síntesis IA diaria para la familia. | Cron 21:00 |
| **IA** | Detectar Patrones | Análisis de conducta de 72 horas. | Cron cada 6h |
| **IA** | Análisis Sentimiento | Clasificación emocional automática. | Registro texto |
| **IA** | Escalada Conducta | Alerta por agresividad persistente. | Cron 12:00 |
| **EXT** | Google Sheets | Exportación mensual de datos. | Cron mensual |
| **EXT** | Google Calendar | Sincronización de recordatorios. | Webhook |

---

## 💡 Notas para Mantenimiento Futuro
- **Manejo de Fechas**: La tabla `resumenes_consolidados` almacena la fecha de registro en el campo autogenerado `created_at`. No usar `fecha_generacion`.
- **Integraciones con IA**: La app utiliza `VITE_GOOGLE_AI_KEY` para interactuar con Gemini en el cliente. Asegurarse de que el modelo esté configurado para retornar objetos JSON limpios para evitar fallos de parseo.
- **Seguridad**: Nunca deshabilitar las RLS en Supabase; el acceso siempre debe pasar por la verificación de `equipo_pai`.
- **Archivos `.env`**: Jamás forzar la subida del `.env` al repositorio de git ya que contiene credenciales de servicio con bypass de RLS.
---
*Este documento es una entidad viva. Actualícese con cada cambio estructural mayor.*

