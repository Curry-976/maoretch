import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { BrandLogo } from "@/components/Brand";

const LEN = 6;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string | undefined;
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate("/login");
      return;
    }
    inputs.current[0]?.focus();
  }, [email, navigate]);

  if (!email) return null;

  const update = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < LEN - 1) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LEN - 1) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LEN);
    if (!text) return;
    const next = Array(LEN).fill("");
    for (let k = 0; k < text.length; k++) next[k] = text[k];
    setDigits(next);
    inputs.current[Math.min(text.length, LEN - 1)]?.focus();
  };

  const submit = async (code?: string) => {
    const otp = code ?? digits.join("");
    if (otp.length !== LEN) return;
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signIn.emailOtp({ email, otp });
      if (result.error) {
        setError(result.error.message || "Code invalide");
        setDigits(Array(LEN).fill(""));
        inputs.current[0]?.focus();
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const code = digits.join("");
    if (code.length === LEN) submit(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const resend = async () => {
    setResending(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (error) setError(error.message || "Échec de l'envoi");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Grid background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="w-full max-w-[480px] space-y-12 relative z-10">
        {/* Top — back + logo */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-[11px] font-mono-kicker text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
            Retour
          </button>
          <div className="paper-tile rounded-sm px-3 py-2">
            <BrandLogo size="sm" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="font-mono-kicker text-[10px] text-muted-foreground">
            02 — Vérification
          </div>
          <h1 className="font-heading text-5xl text-foreground italic leading-none">
            Le code<span className="text-primary not-italic">.</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nous l'avons envoyé à{" "}
            <span className="text-foreground font-medium not-italic">{email}</span>.
            Valable 10 minutes.
          </p>
        </div>

        {/* OTP boxes */}
        <div className="space-y-6">
          <div className="font-mono-kicker text-[9px] text-muted-foreground">
            6 chiffres
          </div>
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={d}
                onChange={(e) => update(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-full aspect-[3/4] bg-transparent border hairline border-b-foreground/40 focus:border-primary text-center font-heading text-4xl text-foreground italic outline-none transition-all duration-300 ease-out-expo focus:bg-secondary/40 disabled:opacity-50"
              />
            ))}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-[11px] font-mono-kicker text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Vérification…
            </div>
          )}

          {error && (
            <div className="border-l-2 border-destructive pl-3 py-1 text-xs text-destructive font-mono-kicker lowercase first-letter:uppercase tracking-normal">
              {error}
            </div>
          )}
        </div>

        <div className="pt-6 border-t hairline flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Pas reçu ?</span>
          <button
            onClick={resend}
            disabled={resending || loading}
            className="text-[11px] font-mono-kicker text-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            {resending ? "Renvoi en cours…" : "Renvoyer le code ↺"}
          </button>
        </div>
      </div>
    </div>
  );
}
