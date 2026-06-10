import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
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
  const [sent, setSent] = useState(false);
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
    setSent(false);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (error) setError(error.message || "Échec de l'envoi");
      else setSent(true);
    } finally {
      setResending(false);
      setTimeout(() => setSent(false), 4000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-0 dot-grid opacity-40 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 30%, hsl(213 78% 75% / 0.18), transparent 60%)",
        }}
      />

      <div className="w-full max-w-[440px] relative z-10">
        <button
          onClick={() => navigate("/login")}
          className="mb-8 inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={2} />
          Retour
        </button>

        <div className="card-elevated bg-card rounded-lg p-8 lg:p-10 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                Vérification
              </div>
              <h1 className="font-display text-4xl text-foreground tracking-tightest mt-2">
                Le code<span className="text-primary">.</span>
              </h1>
            </div>
            <div className="paper-tile rounded-md p-2.5">
              <BrandLogo size="sm" />
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-secondary/40 rounded-md">
            <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={1.8} />
            <div className="text-[12px] text-muted-foreground leading-relaxed">
              Envoyé à <span className="text-foreground font-medium">{email}</span>.
              Valable 10 minutes.
            </div>
          </div>

          {/* OTP boxes */}
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2">
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
                  className="w-full aspect-square bg-background border-2 hairline-border focus:border-primary focus:ring-4 focus:ring-primary/15 text-center font-display tabular text-3xl text-foreground rounded-md outline-none transition-all duration-300 ease-out-expo disabled:opacity-50"
                />
              ))}
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Vérification du code…
              </div>
            )}

            {error && (
              <div className="px-3 py-2.5 bg-destructive/8 border border-destructive/20 rounded-md text-destructive text-[12px]">
                {error}
              </div>
            )}

            {sent && (
              <div className="px-3 py-2.5 bg-success/8 border border-success/20 rounded-md text-success text-[12px]">
                Nouveau code envoyé.
              </div>
            )}
          </div>

          <div className="pt-5 border-t hairline-border flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">Code non reçu ?</span>
            <button
              onClick={resend}
              disabled={resending || loading}
              className="font-medium text-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              {resending ? "Envoi…" : "Renvoyer le code"}
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-muted-foreground/60 mt-6">
          © Maore-Tech CRM 2026
        </div>
      </div>
    </div>
  );
}
