import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS para llamadas desde el navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role, childName, inviterName } = await req.json()

    // --- NOTA PARA EL USUARIO ---
    // Para que este envío de correo funcione de verdad, necesitas:
    // 1. Un servicio de correo (Resend, SendGrid, etc.)
    // 2. Configurar la API KEY en Supabase: 
    //    supabase secrets set RESEND_API_KEY=tu_llave_aqui
    // ----------------------------

    console.log(`Enviando correo real a: ${email} vía Resend`);
    
    const appUrl = Deno.env.get('APP_URL') || 'https://miangel-connecting-families.vercel.app'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'mIAngel <notificaciones@villarrealconsultora.com.ec>',
        to: [email],
        subject: `Invitación para el equipo de ${childName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4f46e5;">¡Hola!</h1>
            <p>${inviterName} te ha invitado a unirte al equipo de <strong>${childName}</strong> en mIAngel.</p>
            <p>Tu rol asignado es: <strong>${role}</strong>.</p>
            <p>Para empezar, haz clic en el siguiente enlace y crea tu cuenta:</p>
            <a href="${appUrl}/?email=${email}" 
               style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
               Aceptar Invitación
            </a>
            <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
          </div>
        `,
      }),
    })

    const resData = await res.json()
    console.log('Respuesta de Resend:', resData)

    return new Response(
      JSON.stringify({ message: 'Email enviado correctamente', data: resData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
