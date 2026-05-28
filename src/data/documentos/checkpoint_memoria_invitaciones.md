# 🧠 Memoria de Sesión: mIAngel - Flujo de Invitaciones y Observaciones

## 🚀 Logros del 3 de Mayo (Sesión Mañana)
- **Error Base de Datos:** Se resolvió el error `PGRST204` mediante la adición de la columna `rol_registrador` en la tabla `observaciones` y el refresco del esquema con `NOTIFY pgrst, 'reload schema'`. Las observaciones ahora se guardan correctamente.
- **Infraestructura de Invitaciones:** 
    - Se creó y desplegó la Edge Function `send-invitation` en el proyecto `yxngkkfhupkmzmokyigh`.
    - Se actualizó `TeamPage.tsx` para invocar esta función al enviar una invitación.
- **Vinculación Automática:** Se modificó `OnboardingPage.tsx` para detectar invitaciones pendientes por correo electrónico. Si un usuario nuevo fue invitado previamente, el sistema le permite unirse al equipo directamente sin crear un nuevo perfil de niño.
- **Supabase CLI:** El entorno local está vinculado y autenticado.

## 📋 Pendientes para la próxima sesión
1. **Test de Invitación Real:**
    - Invitar un email externo desde la sección Equipo.
    - Registrarse con ese email y validar la pantalla de "Aceptar Invitación" en el Onboarding.
2. **Activación de Emails:** Configurar `RESEND_API_KEY` en Supabase Secrets si se desea que los correos lleguen físicamente.
3. **Alertas:** Comenzar con el sistema de notificaciones para el equipo PAI.

## 🔑 Datos Técnicos
- **Proyecto Supabase:** `yxngkkfhupkmzmokyigh` (mIAngel Conectando familias)
- **Tablas Clave:** `observaciones`, `equipo_pai`, `personas_autismo`.
- **Edge Function:** `send-invitation`.
