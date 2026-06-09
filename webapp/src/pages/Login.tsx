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
    <div className="min-h-screen bg-background flex">
      {/* Left visual */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/20 via-background to-background flex-col justify-between p-12 border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(213_78%_48%/0.18),transparent_60%)]" />
        <div className="relative">
          <div className="inline-flex items-center bg-white/95 rounded-2xl px-5 py-4 shadow-2xl">
            <BrandLogo size="lg" />
          </div>
        </div>
        <div className="relative space-y-4">
          <h2 className="font-heading text-5xl text-foreground leading-tight">
            GÉREZ VOTRE<br />
            <span className="text-primary">BUSINESS</span><br />
            TÉLÉPHONE
          </h2>
          <p className="text-muted-foreground text-lg">
            Suivez vos achats, réparations et ventes de téléphones en un seul endroit.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-4">
          {[
            { label: "Stock géré", value: "∞" },
            { label: "Marge visible", value: "100%" },
          ].map((stat) => (
            <div key={stat.label} className="glass p-4 rounded-xl">
              <p className="font-heading text-3xl text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden mb-8 inline-flex items-center bg-white/95 rounded-xl px-4 py-3 shadow-lg">
            <BrandLogo size="md" />
          </div>

          <div>
            <h2 className="font-heading text-4xl text-foreground">CONNEXION</h2>
            <p className="text-muted-foreground mt-1">Entrez votre email pour recevoir un code</p>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Recevoir le code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
