import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  Plus,
  Smartphone,
  Users,
  Tag,
  CheckCircle2,
  TrendingUp,
  Kanban,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { Client, DashboardStats, Phone } from "@/lib/types";
import { Layout } from "@/components/Layout";

function eur(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function bigMoney(amount: number) {
  if (!amount) return "—";
  return eur(amount);
}

function bigCount(n: number) {
  if (!n) return "—";
  return String(n);
}

const tooltipStyle: React.CSSProperties = {
  background: "hsl(220 30% 10%)",
  border: "1px solid hsl(220 25% 18%)",
  borderRadius: 6,
  padding: 8,
  fontSize: 12,
  color: "hsl(40 20% 96%)",
  fontFamily: "Switzer, sans-serif",
};

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<DashboardStats>("/api/dashboard/stats"),
    refetchInterval: 30000,
  });

  const { data: phones = [] } = useQuery({
    queryKey: ["phones"],
    queryFn: () => api.get<Phone[]>("/api/phones"),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get<Client[]>("/api/clients"),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const monthly = stats?.monthlyData ?? [];
  const lastMonth = monthly[monthly.length - 1];
  const prevMonth = monthly[monthly.length - 2];
  const delta =
    lastMonth && prevMonth && prevMonth.revenue > 0
      ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
      : null;

  const recentPhones = phones.slice(0, 5);
  const verifiedClients = clients.filter((c) => c.status === "verified").length;
  const isEmpty = (stats?.totalPhones ?? 0) === 0;

  const now = new Date();
  const dayName = now.toLocaleDateString("fr-FR", { weekday: "long" });
  const dayNum = now.toLocaleDateString("fr-FR", { day: "2-digit" });
  const monthName = now.toLocaleDateString("fr-FR", { month: "long" });
  const yearNum = now.getFullYear();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <Layout>
      <div className="px-6 md:px-10 py-8 md:py-12 space-y-12 max-w-[1400px]">
        {/* === DATE HERO — no editorial period, no italic-bold mash === */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b hairline-border">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-success/60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                </span>
                En direct
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span>{greeting}, Fahel</span>
            </div>
            <h1 className="font-display text-[clamp(3rem,5.5vw,4.4rem)] leading-[0.96] text-foreground tracking-tightest">
              <span className="capitalize">{dayName}</span>{" "}
              <span className="font-italic font-normal text-foreground/85">
                {dayNum} {monthName}
              </span>{" "}
              <span className="text-muted-foreground/50 tabular text-[0.6em] align-top">{yearNum}</span>
            </h1>
          </div>
          <Link
            to="/add-phone"
            className="btn-magnetic inline-flex items-center gap-2 px-4 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90 self-start md:self-end"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Ajouter un téléphone
          </Link>
        </header>

        {/* === HERO ROW : 2 big cards === */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5">
          {/* Revenue hero */}
          <div className="card-soft rounded-lg p-7 lg:p-9 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, hsl(213 78% 80% / 0.30), transparent 70%)",
              }}
            />
            <div className="relative space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                    Chiffre d'affaires
                  </div>
                  <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                    Cumul depuis le début · {monthly.length} mois suivis
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-foreground/8 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-foreground" strokeWidth={2} />
                </div>
              </div>

              <div className="font-display tabular text-[clamp(3.4rem,6vw,5.5rem)] leading-none tracking-tightest text-foreground">
                {bigMoney(stats?.totalRevenue ?? 0)}
              </div>

              <div className="flex items-center gap-4 text-sm">
                {delta !== null && delta !== 0 ? (
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      delta > 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    <ArrowUpRight
                      className={`w-3.5 h-3.5 ${delta < 0 ? "rotate-90" : ""}`}
                    />
                    {delta > 0 ? "+" : ""}
                    {delta.toFixed(1)}% sur 30 j
                  </span>
                ) : (
                  <span className="text-muted-foreground/60">Aucune vente ce mois-ci</span>
                )}
                <span className="text-muted-foreground">
                  Bénéfice : <span className="text-foreground font-medium">{eur(stats?.totalProfit ?? 0)}</span>
                </span>
              </div>

              {/* Mini sparkline */}
              <div className="-mx-2 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(220 30% 10%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(220 30% 10%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={false}
                      formatter={(v: number) => [eur(v), "Revenu"]}
                      labelStyle={{ color: "hsl(40 20% 80%)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(220 30% 10%)"
                      strokeWidth={2}
                      fill="url(#heroGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Stock value card */}
          <div className="ink-surface rounded-lg p-7 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 dot-grid opacity-10 pointer-events-none"
            />
            <div className="relative space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-ink-foreground/60 font-medium">
                    Valeur du stock
                  </div>
                  <div className="text-[11px] text-ink-foreground/40 mt-0.5">
                    Capital immobilisé
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-foreground" strokeWidth={2} />
                </div>
              </div>

              <div className="font-display tabular text-[clamp(2.6rem,4vw,3.6rem)] leading-none tracking-tightest text-ink-foreground">
                {bigMoney(stats?.totalInventoryValue ?? 0)}
              </div>

              <div className="space-y-3 pt-2 border-t border-sidebar-border">
                <Row label="Téléphones en vente" value={String(stats?.forSaleCount ?? 0)} />
                <Row label="Vendus à ce jour" value={String(stats?.soldCount ?? 0)} />
                <Row label="Total enregistré" value={String(stats?.totalPhones ?? 0)} />
              </div>
            </div>
          </div>
        </section>

        {/* === SECONDARY STAT TILES === */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Tile
            icon={<Smartphone className="w-3.5 h-3.5" />}
            label="Téléphones"
            value={bigCount(stats?.totalPhones ?? 0)}
            sub={`${stats?.forSaleCount ?? 0} en vente`}
            href="/phones"
          />
          <Tile
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            label="Vendus"
            value={String(stats?.soldCount ?? 0)}
            sub="Cumul"
            href="/phones"
          />
          <Tile
            icon={<Users className="w-3.5 h-3.5" />}
            label="Clients"
            value={String(clients.length)}
            sub={`${verifiedClients} vérifié${verifiedClients > 1 ? "s" : ""}`}
            href="/clients"
          />
          <Tile
            icon={<Kanban className="w-3.5 h-3.5" />}
            label="Pipeline actif"
            value={String(stats?.forSaleCount ?? 0)}
            sub="Téléphones en mouvement"
            href="/pipeline"
            badge="Nouveau"
          />
        </section>

        {isEmpty ? (
          <section className="card-soft rounded-lg p-12 text-center space-y-6 dot-grid">
            <div className="inline-flex w-14 h-14 rounded-full bg-foreground/8 items-center justify-center mx-auto">
              <Plus className="w-6 h-6 text-foreground" strokeWidth={2} />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-display text-3xl text-foreground tracking-tightest">
                Démarrons.
              </h3>
              <p className="text-[15px] text-muted-foreground">
                Aucun téléphone enregistré pour l'instant. Ajoutez votre premier appareil
                et le tableau de bord s'anime instantanément.
              </p>
            </div>
            <Link
              to="/add-phone"
              className="btn-magnetic inline-flex items-center gap-2 px-5 py-3 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Enregistrer un téléphone
            </Link>
          </section>
        ) : (
          <>
            {/* === CHARTS ROW === */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div className="card-soft rounded-lg p-6 lg:col-span-3">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                      Chiffre d'affaires
                    </div>
                    <div className="font-display text-xl text-foreground mt-0.5">6 derniers mois</div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-foreground" />
                    Revenus
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={monthly} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(220 30% 10%)" stopOpacity={0.30} />
                        <stop offset="100%" stopColor="hsl(220 30% 10%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="hsl(220 14% 92%)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(220 8% 42%)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(220 8% 42%)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ stroke: "hsl(220 30% 10%)", strokeOpacity: 0.3 }}
                      formatter={(v: number) => [eur(v), "Revenu"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(220 30% 10%)"
                      strokeWidth={2}
                      fill="url(#revGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card-soft rounded-lg p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                      Bénéfice mensuel
                    </div>
                    <div className="font-display text-xl text-foreground mt-0.5">Évolution</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthly} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="hsl(220 14% 92%)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "hsl(220 8% 42%)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "hsl(220 8% 42%)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "hsl(220 14% 95% / 0.5)" }}
                      formatter={(v: number) => [eur(v), "Bénéfice"]}
                    />
                    <Bar dataKey="profit" fill="hsl(220 30% 18%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* === RECENT ACTIVITY === */}
            {recentPhones.length > 0 && (
              <section className="card-soft rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b hairline-border">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                      Mouvements récents
                    </div>
                    <div className="font-display text-xl text-foreground mt-0.5">
                      Derniers téléphones
                    </div>
                  </div>
                  <Link
                    to="/phones"
                    className="group inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Tout voir
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                <div className="divide-y hairline-border">
                  {recentPhones.map((p) => {
                    const margin = p.resalePrice - p.purchasePrice - p.repairPrice;
                    return (
                      <Link
                        key={p.id}
                        to="/phones"
                        className="flex items-center gap-4 p-4 hover:bg-secondary/40 transition-colors"
                      >
                        <div className="w-11 h-11 rounded-md bg-secondary border hairline-border overflow-hidden flex-shrink-0">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.model} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                              <Smartphone className="w-4 h-4" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-foreground truncate">{p.model}</span>
                            <span
                              className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
                                p.status === "sold"
                                  ? "bg-success/10 text-success"
                                  : "bg-foreground/8 text-primary"
                              }`}
                            >
                              {p.status === "sold" ? "Vendu" : "En vente"}
                            </span>
                          </div>
                          <div className="text-[12px] text-muted-foreground mt-0.5">
                            {p.seller.firstName} {p.seller.lastName} · {p.seller.village}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-display tabular text-lg ${
                              margin >= 0 ? "text-foreground" : "text-destructive"
                            }`}
                          >
                            {margin >= 0 ? "+" : ""}
                            {eur(margin)}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Marge</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-ink-foreground/60">{label}</span>
      <span className="font-medium text-ink-foreground tabular">{value}</span>
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  sub,
  href,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      to={href}
      className="card-soft rounded-lg p-5 group hover:-translate-y-0.5 hover:border-foreground/40 transition-all duration-500 ease-out-expo relative"
    >
      <div className="flex items-start justify-between">
        <div className="w-7 h-7 rounded-md bg-foreground/8 text-foreground flex items-center justify-center">
          {icon}
        </div>
        {badge && (
          <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-foreground text-background font-medium rounded">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
        {label}
      </div>
      <div className="mt-1 font-display tabular text-3xl text-foreground tracking-tightest">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
      <ArrowUpRight
        className="absolute top-5 right-5 w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 group-hover:text-foreground transition-all duration-500"
        strokeWidth={2}
      />
    </Link>
  );
}
