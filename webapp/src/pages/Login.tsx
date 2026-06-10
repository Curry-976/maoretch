import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/Brand";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });
      if (result.error) {
        setError(result.error.message || "Impossible d'envoyer le code");
      } else {
        navigate("/verify-otp", { state: { email: email.trim() } });
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Architectural grid (subtle) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* === LEFT — editorial pane (62%) === */}
      <div className="hidden lg:flex flex-col justify-between basis-[62%] p-12 xl:p-16 relative z-10 border-r hairline">
        {/* Top — kicker + logo on paper tile */}
        <div className="flex items-start justify-between gap-8">
          <div>
            <div className="font-mono-kicker text-[10px] text-muted-foreground">
              01 — Plateforme B2B
            </div>
            <div className="mt-2 text-xs text-muted-foreground/70 max-w-[180px] leading-relaxed">
              Maore-Tech CRM — Outil de gestion pour revendeurs de téléphones,
              Afrique de l'Ouest.
            </div>
          </div>

          <div className="paper-tile rounded-md p-4 brand-glow">
            <BrandLogo size="lg" className="mx-auto" />
          </div>
        </div>

        {/* Center — editorial headline */}
        <div className="space-y-8 max-w-[520px]">
          <h1 className="font-heading text-[clamp(3.5rem,6vw,5.5rem)] leading-[0.96] text-foreground italic">
            Votre stock,
            <br />
            <span className="not-italic">vos vendeurs,</span>
            <br />
            vos marges<span className="text-primary">.</span>
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed max-w-md">
            Du téléphone fissuré dans la main d'un démarcheur jusqu'à la vente
            finale, chaque étape suivie. Sans tableur, sans approximation.
          </p>
        </div>

        {/* Bottom — three quiet facts, no placebo stats */}
        <div className="grid grid-cols-3 gap-6 text-xs">
          {[
            { kicker: "Suivi", value: "Temps réel", sub: "Actualisation 30 s" },
            { kicker: "Données", value: "Locales", sub: "Hébergées sur Railway" },
            { kicker: "Sécurité", value: "Code unique", sub: "Connexion par email" },
          ].map((stat) => (
            <div key={stat.kicker} className="space-y-1.5">
              <div className="font-mono-kicker text-[9px] text-muted-foreground">
                {stat.kicker}
              </div>
              <div className="font-heading text-xl text-foreground">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground/70">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* === RIGHT — form pane (38%) === */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[340px] space-y-12">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <div className="paper-tile rounded-md p-4 inline-block">
              <BrandLogo size="md" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-mono-kicker text-[10px] text-muted-foreground">
              02 — Accès
            </div>
            <h2 className="font-heading text-5xl text-foreground italic leading-none">
              Connexion<span className="text-primary not-italic">.</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Entrez votre email. Vous recevez un code à 6 chiffres,
              valable 10 minutes.
            </p>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-6">
            {/* Editorial input — no box, just an underline */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="font-mono-kicker text-[9px] text-muted-foreground block"
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoFocus
                className="w-full px-0 py-3 bg-transparent text-foreground text-base placeholder:text-muted-foreground/40 border-0 border-b hairline focus:outline-none focus:border-primary transition-colors duration-300 ease-out-expo"
              />
            </div>

            {error && (
              <div className="p-3 border border-destructive/30 bg-destructive/5 text-destructive text-xs font-mono-kicker tracking-normal lowercase first-letter:uppercase">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="group relative w-full flex items-center justify-between gap-2 px-5 py-3.5 bg-foreground text-background text-sm font-medium hover:bg-foreground/95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-500 ease-out-expo overflow-hidden"
            >
              {/* Shimmer sweep */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer-sweep 2s ease-in-out infinite",
                }}
              />
              <span className="relative">
                {loading ? "Envoi du code…" : "Recevoir le code"}
              </span>
              <span className="relative flex items-center gap-2">
                <span className="font-mono-kicker text-[9px] opacity-50">↵ ENVOI</span>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
                )}
              </span>
            </button>
          </form>

          <div className="pt-6 border-t hairline space-y-2">
            <div className="font-mono-kicker text-[9px] text-muted-foreground">
              Aucun compte requis
            </div>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Première connexion ? Le code créé automatiquement votre espace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
