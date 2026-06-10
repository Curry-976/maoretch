import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { ArrowUpRight, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatStrip } from "@/components/ui/stat-strip";

function eur(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "hsl(30 8% 9%)",
  border: "0.5px solid hsl(30 6% 18%)",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "DM Sans, sans-serif",
};

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<DashboardStats>("/api/dashboard/stats"),
    refetchInterval: 30000,
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

  const s = stats;
  const isEmpty = !s || s.totalPhones === 0;
  const monthlyData = s?.monthlyData ?? [];
  const lastMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const delta =
    lastMonth && prevMonth && prevMonth.revenue > 0
      ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
      : null;

  return (
    <Layout>
      <div className="px-6 md:px-10 py-8 md:py-10 space-y-14 max-w-[1400px]">
        <PageHeader
          num="01"
          kicker="Tableau de bord"
          title="Aujourd'hui,"
          emphasis="votre activité"
          subline={
            <>
              Données rafraîchies toutes les 30 secondes. Tout ce qui suit reflète ce
              qui se passe maintenant.
            </>
          }
        />

        {/* Hero KPI + ticker stats */}
        <StatStrip
          hero={{
            kicker: "Chiffre d'affaires cumulé",
            value: eur(s?.totalRevenue ?? 0),
            emphasis: "neutral",
            delta:
              delta !== null && delta !== 0 ? (
                <span
                  className={`inline-flex items-center gap-1 ${
                    delta > 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  <ArrowUpRight
                    className={`w-3 h-3 ${delta < 0 ? "rotate-90" : ""}`}
                  />
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)}% sur 30 j
                </span>
              ) : (
                <span className="text-muted-foreground/60">— Aucune vente ce mois-ci</span>
              ),
            sub: lastMonth ? `Mois en cours · ${lastMonth.month}` : undefined,
          }}
          stats={[
            {
              kicker: "Bénéfice net",
              value: eur(s?.totalProfit ?? 0),
              sub: "CA − coûts",
              emphasis: (s?.totalProfit ?? 0) > 0 ? "positive" : "neutral",
            },
            {
              kicker: "Valeur stock",
              value: eur(s?.totalInventoryValue ?? 0),
              sub: `${s?.forSaleCount ?? 0} téléphones en vente`,
              emphasis: "neutral",
            },
            {
              kicker: "Inventaire",
              value: String(s?.totalPhones ?? 0),
              sub: `${s?.soldCount ?? 0} vendus · ${s?.forSaleCount ?? 0} en vente`,
              emphasis: "neutral",
            },
          ]}
        />

        {/* Divider */}
        <div className="h-px bg-hairline" />

        {isEmpty ? (
          <section className="space-y-6">
            <div className="font-mono-kicker text-[10px] text-muted-foreground">
              02 — Premier pas
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-12 items-end">
              <div className="space-y-5">
                <h2 className="font-heading text-4xl text-foreground italic leading-[1.05]">
                  Rien à afficher
                  <span className="not-italic text-primary">.</span> Pas encore.
                </h2>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Le tableau de bord s'anime dès le premier téléphone enregistré.
                  Ajoutez un appareil acheté chez un vendeur — modèle, état, prix —
                  et les graphiques se peuplent en temps réel.
                </p>
                <Link
                  to="/add-phone"
                  className="group inline-flex items-center gap-3 px-5 py-3 border hairline hover:border-primary text-foreground text-sm font-medium transition-all duration-500 ease-out-expo"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Enregistrer le premier téléphone
                  <span className="font-mono-kicker text-[9px] text-muted-foreground group-hover:translate-x-1 transition-transform duration-500 ease-out-expo">
                    →
                  </span>
                </Link>
              </div>
              <div className="relative aspect-square max-w-[280px] ml-auto opacity-30">
                <svg viewBox="0 0 240 240" fill="none" aria-hidden className="w-full h-full text-foreground">
                  <rect x="80" y="30" width="80" height="170" rx="14" stroke="currentColor" strokeWidth="0.8" />
                  <g stroke="currentColor" strokeWidth="0.5" strokeLinecap="round">
                    <line x1="120" y1="80" x2="120" y2="160" />
                    <line x1="85" y1="100" x2="155" y2="140" />
                    <line x1="85" y1="140" x2="155" y2="100" />
                    <line x1="78" y1="120" x2="162" y2="120" />
                  </g>
                  <circle cx="120" cy="120" r="3" fill="currentColor" />
                </svg>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Revenue */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div className="font-mono-kicker text-[10px] text-muted-foreground">
                  Chiffre d'affaires
                </div>
                <div className="text-[11px] text-muted-foreground/70 tabular">6 derniers mois</div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(213 78% 48%)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(213 78% 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(30 8% 55%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(30 8% 55%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: "hsl(213 78% 48%)", strokeOpacity: 0.3, strokeWidth: 1 }}
                    formatter={(value: number) => [eur(value), "Revenu"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(213 78% 48%)"
                    strokeWidth={1.5}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Profit */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div className="font-mono-kicker text-[10px] text-muted-foreground">
                  Bénéfice mensuel
                </div>
                <div className="text-[11px] text-muted-foreground/70 tabular">6 derniers mois</div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(30 8% 55%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(30 8% 55%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "hsl(30 6% 14% / 0.4)" }}
                    formatter={(value: number) => [eur(value), "Bénéfice"]}
                  />
                  <Bar dataKey="profit" fill="hsl(36 30% 88%)" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
