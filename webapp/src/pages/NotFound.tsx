import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404 — route inconnue:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-0 dot-grid opacity-40 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, hsl(213 78% 75% / 0.15), transparent 70%)",
        }}
      />

      <div className="relative max-w-[640px] w-full space-y-8 text-center">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          404 · Page introuvable
        </div>

        <h1 className="font-display text-[clamp(5rem,13vw,10rem)] leading-[0.9] text-foreground tracking-tightest">
          Cette adresse
          <br />
          <span className="font-italic font-normal text-foreground/85">n'existe pas</span>
          <span className="text-primary">.</span>
        </h1>

        <p className="text-[15px] text-muted-foreground max-w-md mx-auto leading-relaxed">
          La page{" "}
          <code className="font-medium text-foreground bg-secondary/60 px-1.5 py-0.5 rounded text-[13px]">
            {location.pathname}
          </code>{" "}
          n'existe pas (ou plus). Tout va bien — vos données sont intactes.
        </p>

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 border hairline-border rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all duration-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Revenir
          </button>
          <Link
            to="/dashboard"
            className="btn-magnetic inline-flex items-center gap-2 px-5 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90"
          >
            <Home className="w-3.5 h-3.5" strokeWidth={2} />
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
