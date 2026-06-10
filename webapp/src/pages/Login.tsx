import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, Loader2, ShieldCheck, Zap, BarChart3 } from "lucide-react";
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
      {/* === LEFT — editorial pane (light, with aurora gradient) === */}
      <div className="hidden lg:flex flex-col justify-between basis-[58%] p-14 xl:p-20 relative overflow-hidden bg-gradient-to-br from-background via-paper to-background">
        {/* Soft brand aurora */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 50% at 15% 25%, hsl(213 78% 75% / 0.25), transparent 60%), radial-gradient(40% 40% at 85% 80%, hsl(36 70% 75% / 0.20), transparent 70%)",
          }}
        />
        {/* Subtle dot grid */}
        <div aria-hidden className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

        {/* Top — logo + kicker */}
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              Plateforme · Maore-Tech
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground/70">
              CRM phone-reseller — Mayotte & Afrique de l'Ouest
            </div>
          </div>
          <div className="paper-tile rounded-md p-4">
            <BrandLogo size="lg" />
          </div>
        </div>

        {/* Center — magazine headline */}
        <div className="relative z-10 space-y-10 max-w-[600px]">
          <div className="space-y-6">
            <h1 className="font-display text-[clamp(3.8rem,6.4vw,5.8rem)] leading-[0.95] text-foreground tracking-tightest text-balance">
              Votre business <span className="font-italic font-normal">téléphone</span>,
              <br />
              suivi au gramme près<span className="text-primary">.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Achat, réparation, revente, vendeurs, clients, marges.
              Un seul écran. Aucun tableur.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Zap, label: "Pipeline visuel" },
              { icon: BarChart3, label: "Marges en temps réel" },
              { icon: ShieldCheck, label: "Contrats signés numériquement" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 px-3.5 py-2 bg-card border hairline-border rounded-full text-xs text-foreground font-medium"
              >
                <f.icon className="w-3 h-3 text-foreground" strokeWidth={2} />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — testimonial-style */}
        <div className="relative z-10 max-w-[460px]">
          <blockquote className="font-italic text-2xl text-foreground/85 leading-snug text-balance">
            « J'ai arrêté Excel le jour où j'ai ouvert Maore-Tech.
            En une semaine, j'avais doublé ma marge sur les iPhone reconditionnés. »
          </blockquote>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-ink text-ink-foreground flex items-center justify-center text-[12px] font-semibold">
              M
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">Moussa Diop</div>
              <div className="text-[11px] text-muted-foreground">Revendeur — Dakar, Sénégal</div>
            </div>
          </div>
        </div>
      </div>

      {/* === RIGHT — form pane === */}
      <div className="flex-1 flex flex-col bg-card lg:bg-background relative">
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[380px] space-y-10">
            <div className="lg:hidden inline-flex paper-tile rounded-md p-3">
              <BrandLogo size="md" />
            </div>

            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                Connexion
              </div>
              <h2 className="font-display text-[2.6rem] leading-[1.05] text-foreground tracking-tightest">
                Bon retour,
                <br />
                <span className="font-italic font-normal text-foreground/90">commençons.</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Entrez votre email. Vous recevez un code à 6 chiffres,
                valable 10 minutes.
              </p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium block"
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
                  className="w-full px-4 py-3.5 bg-card border hairline-border rounded-md text-foreground text-[15px] placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-300 ease-out-expo"
                />
              </div>

              {error && (
                <div className="px-3 py-2.5 bg-destructive/8 border border-destructive/20 rounded-md text-destructive text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-magnetic group w-full flex items-center justify-center gap-2 px-5 py-3.5 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-ink/20 hover:shadow-primary/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    Recevoir le code
                    <ArrowRight className="w-4 h-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-6 border-t hairline-border space-y-1">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                Aucun mot de passe
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Première connexion ? Le code crée automatiquement votre espace —
                rien d'autre à remplir.
              </p>
            </div>
          </div>
        </div>

        {/* Footer mini */}
        <div className="hidden lg:flex items-center justify-between px-12 py-5 text-[11px] text-muted-foreground border-t hairline-border">
          <span>© Maore-Tech CRM 2026</span>
          <span className="tabular">Mayotte · Afrique de l'Ouest</span>
        </div>
      </div>
    </div>
  );
}
