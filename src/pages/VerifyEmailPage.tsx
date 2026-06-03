import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-8 text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-4">Verifica tu Email</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Ingresa a tu email y haz clic en el enlace de verificación.
        </p>

        <Button className="w-full btn-touch" variant="outline" onClick={() => navigate("/login")}>
          Volver a iniciar sesión
        </Button>
      </div>
    </div>
  );
}
