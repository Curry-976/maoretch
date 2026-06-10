import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, Loader2, ShieldCheck, Zap, BarChart3, Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/Brand";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message || "Identifiants invalides");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* === LEFT — editorial pane === */}
      <div className="hidden lg:flex flex-col justify-between basis-[58%] p-14 xl:p-20 relative overflow-hidden bg-gradient-to-br from-background via-paper to-background">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 50% at 15% 25%, hsl(213 78% 75% / 0.25), transparent 60%), radial-gradient(40% 40% at 85% 80%, hsl(36 70% 75% / 0.20), transparent 70%)",
          }}
        />
        <div aria-hidden className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              Maore-Tech · Outil interne
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground/70">
              CRM revente de téléphones — Mamoudzou, Mayotte
            </div>
          </div>
          <div className="paper-tile rounded-md p-4">
            <BrandLogo size="lg" />
          </div>
        </div>

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

        <div className="relative z-10 max-w-[460px] space-y-4">
          <div className="h-px w-12 bg-foreground/30" />
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              Édition 2026 · Mamoudzou
            </div>
            <p className="text-sm text-muted-foreground/85 leading-relaxed text-balance">
              Outil interne <span className="text-foreground font-medium">Maore-Tech</span> —
              accès réservé. Les comptes sont créés par l'administrateur.
            </p>
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
                Identifiez-vous avec votre adresse email et votre mot de passe.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
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
                  placeholder="vous@maore-tech.yt"
                  required
                  autoFocus
                  autoComplete="email"
                  className="w-full px-4 py-3.5 bg-card border hairline-border rounded-md text-foreground text-[15px] placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-300 ease-out-expo"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium block"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pr-11 px-4 py-3.5 bg-card border hairline-border rounded-md text-foreground text-[15px] placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-300 ease-out-expo"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" strokeWidth={1.8} />
                    ) : (
                      <Eye className="w-4 h-4" strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-3 py-2.5 bg-destructive/8 border border-destructive/20 rounded-md text-destructive text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="btn-magnetic group w-full flex items-center justify-center gap-2 px-5 py-3.5 ink-surface rounded-md text-[14px] font-medium hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-ink/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connexion…
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-4 h-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-6 border-t hairline-border space-y-1">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                Accès réservé
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Pas de compte ? Demandez à votre administrateur. Mot de passe oublié ?
                Idem.
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-between px-12 py-5 text-[11px] text-muted-foreground border-t hairline-border">
          <span>© Maore-Tech CRM 2026</span>
          <span className="tabular">Mamoudzou · Mayotte 976</span>
        </div>
      </div>
    </div>
  );
}
