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
  Kanban,
  Activity,
  UserCog,
  Search,
  Bell,
  Command,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { BrandLogo } from "@/components/Brand";

const sections = [
  {
    label: "Aperçu",
    items: [
      { path: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { path: "/activity", label: "Activité", icon: Activity },
    ],
  },
  {
    label: "Inventaire",
    items: [
      { path: "/pipeline", label: "Pipeline", icon: Kanban, badge: "Nouveau" },
      { path: "/phones", label: "Téléphones", icon: Smartphone },
      { path: "/add-phone", label: "Ajouter", icon: PlusCircle },
    ],
  },
  {
    label: "Contacts",
    items: [
      { path: "/sellers", label: "Vendeurs", icon: UserCog },
      { path: "/clients", label: "Clients", icon: Users },
    ],
  },
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
      {/* === Desktop sidebar (dark ink contrast against light main) === */}
      <aside className="hidden md:flex w-[244px] flex-col ink-surface relative">
        {/* Logo block */}
        <div className="p-5 pb-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="block group">
            <div className="paper-tile rounded-md p-3 flex items-center justify-center brand-glow">
              <BrandLogo size="md" />
            </div>
            <div className="mt-3 px-0.5 flex items-center justify-between">
              <span className="font-display text-[10px] tracking-[0.16em] text-ink-foreground/70 uppercase">
                Maore-Tech
              </span>
              <span className="text-[9px] text-ink-foreground/30 uppercase tracking-[0.16em]">
                CRM
              </span>
            </div>
          </Link>
        </div>

        {/* Quick search button */}
        <button className="mx-4 mt-4 mb-2 group flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-sidebar-accent/60 hover:bg-sidebar-accent text-ink-foreground/70 hover:text-ink-foreground transition-all duration-300 ease-out-expo border border-sidebar-border">
          <span className="flex items-center gap-2 text-[12px]">
            <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
            Rechercher…
          </span>
          <span className="flex items-center gap-0.5 text-[9px] text-ink-foreground/40">
            <Command className="w-2.5 h-2.5" strokeWidth={1.5} />K
          </span>
        </button>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.16em] text-ink-foreground/40 font-medium">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map(({ path, label, icon: Icon, badge }) => {
                  const active = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`group relative flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all duration-300 ease-out-expo ${
                        active
                          ? "bg-sidebar-accent text-ink-foreground font-medium"
                          : "text-ink-foreground/65 hover:text-ink-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-primary" />
                      )}
                      <Icon
                        className="w-4 h-4 flex-shrink-0"
                        strokeWidth={active ? 1.8 : 1.5}
                      />
                      <span className="flex-1">{label}</span>
                      {badge && (
                        <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-primary/20 text-primary font-medium rounded">
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
              {session?.user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-ink-foreground/50 leading-none">
                Connecté
              </div>
              <div className="text-[12px] text-ink-foreground font-medium truncate mt-0.5">
                {session?.user?.email}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-ink-foreground/40 hover:text-destructive transition-colors p-1 disabled:opacity-50"
              aria-label="Se déconnecter"
            >
              {signingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* === Mobile header === */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 ink-surface px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="paper-tile rounded-sm px-2 py-1.5">
          <BrandLogo size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 flex items-center justify-center text-ink-foreground/70"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 flex items-center justify-center border border-sidebar-border rounded-md text-ink-foreground"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-14 left-0 right-0 ink-surface p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {sections.map((section) => (
              <div key={section.label}>
                <div className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.16em] text-ink-foreground/40 font-medium">
                  {section.label}
                </div>
                <div className="space-y-0.5">
                  {section.items.map(({ path, label, icon: Icon }) => {
                    const active = location.pathname === path;
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                          active
                            ? "bg-sidebar-accent text-ink-foreground font-medium"
                            : "text-ink-foreground/70"
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-3 px-3 py-3 mt-3 text-sm text-ink-foreground/70 hover:text-destructive border-t border-sidebar-border disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
              )}
              Se déconnecter
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 md:overflow-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
