import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify the user making the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user || !user.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Now instantiate a client with the Service Role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const userEmail = user.email.toLowerCase()

    // Find all pending invites for this email
    const { data: pendingInvites, error: fetchError } = await supabaseAdmin
      .from("equipo_pai")
      .select("id, invite_email")
      .is("user_id", null)

    if (fetchError) throw fetchError;

    let linkedCount = 0;
    
    if (pendingInvites && pendingInvites.length > 0) {
      for (const invite of pendingInvites) {
        if (invite.invite_email && invite.invite_email.toLowerCase() === userEmail) {
          const { error: updateError } = await supabaseAdmin
            .from("equipo_pai")
            .update({ user_id: user.id, invite_status: "aceptado" })
            .eq("id", invite.id)
            
          if (updateError) {
             console.error("Failed to link invite:", invite.id, updateError)
          } else {
             linkedCount++
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, linked: linkedCount }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
