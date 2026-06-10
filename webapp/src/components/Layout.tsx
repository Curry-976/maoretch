import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Smartphone, PlusCircle, LogOut, Menu, X, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { BrandLogo } from "@/components/Brand";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/add-phone", label: "Ajouter Téléphone", icon: PlusCircle },
  { path: "/phones", label: "Gestion Téléphones", icon: Smartphone },
  { path: "/clients", label: "Clients", icon: Users },
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
            // Hard reload clears React Query cache and any stale session state.
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
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center justify-center bg-white/95 rounded-xl px-3 py-4 shadow-lg">
            <BrandLogo size="md" />
          </Link>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-3 text-center">
            CRM · Gestion de revente
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground">
              {session?.user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {signingOut ? "Déconnexion..." : "Déconnexion"}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/95 rounded-md px-2 py-1">
          <BrandLogo size="sm" />
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-sidebar border-b border-sidebar-border p-4 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-destructive rounded-lg disabled:opacity-50 disabled:cursor-wait"
            >
              {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              {signingOut ? "Déconnexion..." : "Déconnexion"}
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
