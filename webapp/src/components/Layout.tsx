import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Smartphone,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Users,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { BrandLogo } from "@/components/Brand";

const navItems = [
  { path: "/dashboard", label: "Tableau de bord", num: "01", icon: LayoutDashboard },
  { path: "/add-phone", label: "Ajouter téléphone", num: "02", icon: PlusCircle },
  { path: "/phones", label: "Téléphones", num: "03", icon: Smartphone },
  { path: "/clients", label: "Clients", num: "04", icon: Users },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
          onError: (ctx: { error?: { message?: string } }) => {
            toast.error(ctx.error?.message || "Échec de la déconnexion");
            setSigningOut(false);
          },
        },
      });
    } catch (err) {
      console.error("[signOut]", err);
      toast.error("Échec de la déconnexion");
      setSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-[212px] flex-col bg-sidebar/60 backdrop-blur-2xl border-r hairline">
        <div className="p-5 pt-7">
          <Link to="/dashboard" className="block group">
            <div className="paper-tile rounded-md p-3 transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5">
              <BrandLogo size="md" className="mx-auto" />
            </div>
            <div className="mt-4 flex items-center gap-2 font-mono-kicker text-[9px] text-muted-foreground">
              <span className="h-px flex-1 bg-hairline" />
              <span>CRM 2026</span>
              <span className="h-px flex-1 bg-hairline" />
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map(({ path, label, num, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`group relative flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all duration-300 ease-out-expo rounded-sm ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Active rule on the left */}
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-full bg-primary transition-all duration-500 ease-out-expo ${
                    active ? "h-6 opacity-100" : "h-2 opacity-0 group-hover:opacity-40"
                  }`}
                />
                <span className="font-mono-kicker text-[9px] text-muted-foreground/70 w-5">
                  {num}
                </span>
                <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" strokeWidth={1.5} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t hairline">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-7 h-7 rounded-full bg-secondary/60 border hairline flex items-center justify-center text-[10px] font-semibold text-foreground">
              {session?.user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono-kicker text-[8px] text-muted-foreground">Session</p>
              <p className="text-[11px] font-medium text-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground border hairline hover:border-destructive/40 transition-all duration-300 ease-out-expo rounded-sm disabled:opacity-50 disabled:cursor-wait"
          >
            <span className="flex items-center gap-2">
              {signingOut ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <LogOut className="w-3 h-3" strokeWidth={1.5} />
              )}
              {signingOut ? "Déconnexion…" : "Se déconnecter"}
            </span>
            <span className="font-mono-kicker text-[8px]">↵</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b hairline px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="paper-tile rounded-sm px-2 py-1.5">
          <BrandLogo size="sm" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 flex items-center justify-center border hairline rounded-sm text-foreground"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-md"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-14 left-0 right-0 bg-background border-b hairline p-5 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map(({ path, label, num, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all rounded-sm ${
                    active ? "bg-secondary/60 text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span className="font-mono-kicker text-[9px] text-muted-foreground/70 w-5">
                    {num}
                  </span>
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-3 px-3 py-3 mt-3 text-sm text-muted-foreground hover:text-destructive border-t hairline disabled:opacity-50 disabled:cursor-wait"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
              )}
              {signingOut ? "Déconnexion…" : "Se déconnecter"}
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:overflow-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
