import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone as PhoneIcon,
  MapPin,
  ShieldCheck,
  Search,
  Plus,
  Package,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Seller, Phone } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/ui/empty-state";

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

type SellerWithStats = Seller & {
  phoneCount: number;
  totalRevenue: number;
  hasContract: boolean;
};

export default function Sellers() {
  const [search, setSearch] = useState("");

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["sellers"],
    queryFn: () => api.get<(Seller & { phones?: Phone[] })[]>("/api/sellers"),
  });

  const enriched: SellerWithStats[] = useMemo(() => {
    return sellers.map((s) => {
      const phones = (s.phones ?? []) as Phone[];
      const sold = phones.filter((p) => p.status === "sold");
      return {
        ...s,
        phoneCount: phones.length,
        totalRevenue: sold.reduce((sum, p) => sum + p.resalePrice, 0),
        hasContract: !!s.signatureDataUrl,
      };
    });
  }, [sellers]);

  const filtered = useMemo(() => {
    if (!search) return enriched;
    const s = search.toLowerCase();
    return enriched.filter(
      (seller) =>
        seller.firstName.toLowerCase().includes(s) ||
        seller.lastName.toLowerCase().includes(s) ||
        seller.village.toLowerCase().includes(s) ||
        (seller.email?.toLowerCase().includes(s) ?? false) ||
        (seller.phone?.toLowerCase().includes(s) ?? false),
    );
  }, [enriched, search]);

  const stats = {
    total: enriched.length,
    withContract: enriched.filter((s) => s.hasContract).length,
    totalRevenue: enriched.reduce((sum, s) => sum + s.totalRevenue, 0),
    villages: new Set(enriched.map((s) => s.village)).size,
  };

  return (
    <Layout>
      <div className="px-6 md:px-10 py-8 md:py-12 space-y-10 max-w-[1400px]">
        {/* Data-as-title — the sentence IS the headline */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b hairline-border">
          <div className="space-y-4 max-w-3xl">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              Annuaire des vendeurs
            </div>
            {stats.total > 0 ? (
              <h1 className="font-display text-[clamp(2.2rem,3.6vw,3rem)] leading-[1.05] text-foreground tracking-tightest text-balance">
                <span className="tabular">{stats.total}</span>{" "}
                <span className="text-muted-foreground/70 font-normal">vendeur{stats.total > 1 ? "s" : ""} dans</span>{" "}
                <span className="tabular">{stats.villages}</span>{" "}
                <span className="text-muted-foreground/70 font-normal">village{stats.villages > 1 ? "s" : ""} —</span>{" "}
                <span className="font-italic font-normal">{eur(stats.totalRevenue)}</span>{" "}
                <span className="text-muted-foreground/70 font-normal">générés.</span>
              </h1>
            ) : (
              <h1 className="font-display text-[clamp(2.2rem,3.6vw,3rem)] leading-[1.05] text-foreground tracking-tightest text-balance">
                <span className="text-muted-foreground/60 font-normal">Aucun vendeur encore —</span>{" "}
                <span className="font-italic">le premier rejoindra l'annuaire</span>{" "}
                <span className="text-muted-foreground/60 font-normal">au prochain enregistrement.</span>
              </h1>
            )}
          </div>
          <Link
            to="/add-phone"
            className="btn-magnetic inline-flex items-center gap-2 px-4 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-primary self-start"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Enregistrer un téléphone
          </Link>
        </header>

        {/* Stats strip */}
        {stats.total > 0 && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Total vendeurs" value={String(stats.total)} sub={`${stats.villages} village${stats.villages > 1 ? "s" : ""}`} />
            <StatTile
              label="Contrats signés"
              value={`${stats.withContract}/${stats.total}`}
              sub={`${stats.total > 0 ? Math.round((stats.withContract / stats.total) * 100) : 0}% conformité`}
            />
            <StatTile
              label="CA généré"
              value={eur(stats.totalRevenue)}
              sub="Via leurs téléphones"
            />
            <StatTile
              label="Téléphones cédés"
              value={String(enriched.reduce((s, x) => s + x.phoneCount, 0))}
              sub="Cumul tous vendeurs"
            />
          </section>
        )}

        {/* Search */}
        {stats.total > 0 && (
          <div className="relative max-w-md">
            <Search
              strokeWidth={1.8}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, village, contact…"
              className="w-full pl-10 pr-4 py-3 bg-card border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : enriched.length === 0 ? (
          <EmptyState
            eyebrow="Aucun vendeur enregistré"
            title="Vos vendeurs apparaîtront"
            italic="ici"
            body={
              <>
                Dès que vous enregistrez un téléphone d'un nouveau vendeur, il rejoint
                cette page automatiquement. Vous y verrez son contrat signé, ses villages
                d'origine, et le chiffre d'affaires qu'il vous aura permis de générer.
              </>
            }
            action={
              <Link
                to="/add-phone"
                className="btn-magnetic inline-flex items-center gap-2 px-5 py-3 ink-surface rounded-md text-[13px] font-medium hover:bg-primary"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Enregistrer un premier téléphone
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((seller) => (
              <SellerCard key={seller.id} seller={seller} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-soft rounded-lg p-5">
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
        {label}
      </div>
      <div className="mt-2 font-display tabular text-2xl text-foreground tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function SellerCard({ seller }: { seller: SellerWithStats }) {
  return (
    <article className="card-soft rounded-lg p-5 space-y-4 hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-500 ease-out-expo">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/15 to-secondary flex items-center justify-center text-foreground font-display text-sm font-semibold flex-shrink-0">
            {seller.firstName[0]}
            {seller.lastName[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg text-foreground tracking-tight truncate">
              {seller.firstName} {seller.lastName}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <MapPin className="w-2.5 h-2.5" strokeWidth={1.5} /> {seller.village}
            </div>
          </div>
        </div>
        {seller.hasContract && (
          <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-[9px] uppercase tracking-wider font-medium">
            <ShieldCheck className="w-2.5 h-2.5" strokeWidth={2} />
            Signé
          </div>
        )}
      </header>

      <div className="space-y-1.5 text-[12px] text-muted-foreground">
        {seller.email && (
          <a
            href={`mailto:${seller.email}`}
            className="flex items-center gap-2 hover:text-foreground transition-colors truncate"
          >
            <Mail className="w-3 h-3" strokeWidth={1.5} />
            <span className="truncate">{seller.email}</span>
          </a>
        )}
        {seller.phone && (
          <a
            href={`tel:${seller.phone}`}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <PhoneIcon className="w-3 h-3" strokeWidth={1.5} />
            {seller.phone}
          </a>
        )}
        {!seller.email && !seller.phone && (
          <div className="text-muted-foreground/50 italic">Aucun contact renseigné</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3 border-t hairline-border">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Téléphones cédés
          </div>
          <div className="font-display tabular text-xl text-foreground mt-0.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            {seller.phoneCount}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
            CA généré
          </div>
          <div className="font-display tabular text-xl text-foreground mt-0.5">
            {eur(seller.totalRevenue)}
          </div>
        </div>
      </div>
    </article>
  );
}
