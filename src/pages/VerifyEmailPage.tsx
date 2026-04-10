import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const canVerify = code.every(d => d !== "");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-8 text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-2">Verifica tu Email</h1>
        <p className="text-muted-foreground text-sm mb-8">Hemos enviado un código a tu email</p>

        <div className="flex justify-center gap-3 mb-6">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-input rounded-lg focus:border-primary focus:outline-none transition-colors"
            />
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {countdown > 0 ? `Solicitar código nuevamente en ${countdown}s` : (
            <button className="text-secondary hover:underline" onClick={() => setCountdown(60)}>Reenviar código</button>
          )}
        </p>

        <Button className="w-full btn-touch" disabled={!canVerify} onClick={() => navigate("/onboarding/create-child")}>
          Verificar
        </Button>
      </div>
    </div>
  );
}
