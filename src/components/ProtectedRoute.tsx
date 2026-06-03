import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export function ProtectedRoute() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      // Auto-vincular invitaciones pendientes por email antes de cargar la app
      if (session?.user?.email) {
        try {
          const { data: pendingInvites } = await supabase
            .from("equipo_pai")
            .select("id")
            .eq("invite_email", session.user.email)
            .is("user_id", null);
            
          if (pendingInvites && pendingInvites.length > 0) {
            for (const invite of pendingInvites) {
              await supabase
                .from("equipo_pai")
                .update({ user_id: session.user.id, invite_status: "aceptado" })
                .eq("id", invite.id);
            }
          }
        } catch (e) {
          console.error("Error auto-linking invites", e);
        }
      }
      
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <p className="text-muted-foreground animate-pulse">Cargando mIAngel...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
