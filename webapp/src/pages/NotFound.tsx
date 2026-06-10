import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404 — route inconnue:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="relative max-w-[640px] w-full space-y-12">
        <div className="font-mono-kicker text-[10px] text-muted-foreground">
          404 — page introuvable
        </div>

        <h1 className="font-heading text-[clamp(5rem,14vw,11rem)] leading-[0.9] text-foreground italic">
          Cette adresse
          <br />
          <span className="not-italic">n'existe pas</span>
          <span className="text-primary not-italic">.</span>
        </h1>

        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          La page <code className="font-mono text-foreground text-xs">{location.pathname}</code>{" "}
          n'est pas (ou plus) connue du serveur. Tout va bien — vous pouvez retourner
          à l'accueil sans perdre vos données.
        </p>

        <Link
          to="/"
          className="group inline-flex items-center gap-3 px-5 py-3 border hairline hover:border-primary text-foreground text-sm font-medium transition-all duration-500 ease-out-expo"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-500 ease-out-expo group-hover:-translate-x-1" strokeWidth={1.5} />
          Retour à l'accueil
          <span className="font-mono-kicker text-[9px] text-muted-foreground">↵</span>
        </Link>
      </div>
    </div>
  );
}
