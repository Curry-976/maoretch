import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import { TrendingUp, Package, ShoppingCart, DollarSign, BarChart2, Smartphone } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Layout } from "@/components/Layout";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

function StatCard({ title, value, subtitle, icon: Icon }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="p-2.5 rounded-lg bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
  );
}

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
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const s = stats;

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl">
        {/* Header */}
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-wide">TABLEAU DE BORD</h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble de votre activité de revente</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Chiffre d'affaires"
            value={formatCurrency(s?.totalRevenue ?? 0)}
            subtitle="Téléphones vendus"
            icon={DollarSign}
          />
          <StatCard
            title="Bénéfice net"
            value={formatCurrency(s?.totalProfit ?? 0)}
            subtitle="Après coûts"
            icon={TrendingUp}
          />
          <StatCard
            title="Valeur stock"
            value={formatCurrency(s?.totalInventoryValue ?? 0)}
            subtitle={`${s?.forSaleCount ?? 0} en vente`}
            icon={Package}
          />
          <StatCard
            title="Total téléphones"
            value={String(s?.totalPhones ?? 0)}
            subtitle="Tous statuts"
            icon={Smartphone}
          />
          <StatCard
            title="Vendus"
            value={String(s?.soldCount ?? 0)}
            subtitle="Téléphones vendus"
            icon={ShoppingCart}
          />
          <StatCard
            title="En vente"
            value={String(s?.forSaleCount ?? 0)}
            subtitle="Dans le stock"
            icon={BarChart2}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-heading text-xl text-foreground tracking-wide mb-4">CHIFFRE D'AFFAIRES (6 MOIS)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={s?.monthlyData ?? []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38,95%,55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38,95%,55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(220,10%,50%)", fontSize: 11 }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(220,15%,11%)", border: "1px solid hsl(220,15%,18%)", borderRadius: "8px" }}
                  labelStyle={{ color: "hsl(40,20%,95%)" }}
                  formatter={(value: number) => [formatCurrency(value), "Revenu"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(38,95%,55%)" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Profit chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-heading text-xl text-foreground tracking-wide mb-4">BÉNÉFICE MENSUEL</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={s?.monthlyData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(220,10%,50%)", fontSize: 11 }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(220,15%,11%)", border: "1px solid hsl(220,15%,18%)", borderRadius: "8px" }}
                  labelStyle={{ color: "hsl(40,20%,95%)" }}
                  formatter={(value: number) => [formatCurrency(value), "Bénéfice"]}
                />
                <Bar dataKey="profit" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}
