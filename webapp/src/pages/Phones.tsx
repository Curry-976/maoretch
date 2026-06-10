import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  CheckCircle,
  ShoppingCart,
  ChevronDown,
  Plus,
  Smartphone as SmartphoneIcon,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";
import { Phone } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/ui/empty-state";
import { PageMotion } from "@/components/ui/page-motion";
import { CountUp } from "@/components/ui/count-up";
import { SkeletonRows } from "@/components/ui/skeleton";
import { GhostBand } from "@/components/ui/ghost-band";
import { GHOST_PHONES } from "@/lib/ghosts";

function Datum({ value, label, wide = false }: { value: number | string; label: string; wide?: boolean }) {
  const isNumberZero = typeof value === "number" && value === 0;
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`font-display tabular leading-none ${wide ? "text-3xl" : "text-3xl"} text-foreground tracking-tightest`}>
        {isNumberZero ? "—" : typeof value === "number" ? <CountUp value={value} /> : value}
      </span>
      <span className="text-[12px] text-muted-foreground">{label}</span>
    </div>
  );
}

function Sep() {
  return <span className="text-muted-foreground/30 select-none">·</span>;
}

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const FILTERS = [
  { key: "all" as const, label: "Tous" },
  { key: "for_sale" as const, label: "En vente" },
  { key: "sold" as const, label: "Vendus" },
];

export default function Phones() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "for_sale" | "sold">("all");

  const { data: phones = [], isLoading } = useQuery({
    queryKey: ["phones"],
    queryFn: () => api.get<Phone[]>("/api/phones"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: string }) =>
      api.patch<Phone>(`/api/phones/${id}`, {
        status: currentStatus === "sold" ? "for_sale" : "sold",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Statut mis à jour");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/phones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Téléphone supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const filtered = phones.filter((p) => {
    const matchSearch =
      !search ||
      p.model.toLowerCase().includes(search.toLowerCase()) ||
      `${p.seller.firstName} ${p.seller.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      p.seller.village.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: phones.length,
    forSale: phones.filter((p) => p.status === "for_sale").length,
    sold: phones.filter((p) => p.status === "sold").length,
    revenue: phones
      .filter((p) => p.status === "sold")
      .reduce((s, p) => s + p.resalePrice, 0),
  };

  return (
    <Layout>
      <PageMotion className="px-6 md:px-10 py-8 md:py-12 space-y-8 max-w-[1400px]">
        {/* Inline metadata header — looks like a ledger top-row */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pb-6 border-b hairline-border">
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              Inventaire
            </div>
            <div className="flex items-baseline gap-x-6 gap-y-3 flex-wrap">
              <Datum value={stats.total} label="appareils" />
              <Sep />
              <Datum value={stats.forSale} label="en vente" />
              <Sep />
              <Datum value={stats.sold} label="vendus" />
              <Sep />
              <Datum
                value={stats.revenue ? eur(stats.revenue) : "—"}
                label="générés"
                wide
              />
            </div>
          </div>
          <Link
            to="/add-phone"
            className="btn-magnetic inline-flex items-center gap-2 px-4 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90 self-start"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau téléphone
          </Link>
        </header>

        {/* Toolbar */}
        {phones.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                strokeWidth={1.8}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Modèle, vendeur, village…"
                className="w-full pl-10 pr-4 py-3 bg-card border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
              />
            </div>
            <div className="inline-flex items-center gap-0.5 p-1 bg-secondary/50 border hairline-border rounded-md">
              <Filter className="w-3.5 h-3.5 text-muted-foreground mx-2" strokeWidth={1.5} />
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded text-[12px] font-medium transition-all duration-300 ease-out-expo ${
                    filter === f.key
                      ? "ink-surface shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <SkeletonRows count={5} rowHeight="h-[82px]" />
        ) : phones.length === 0 ? (
          <>
            <EmptyState
              eyebrow="Inventaire vide"
              title="Le premier téléphone"
              italic="n'attend que vous"
              body={
                <>
                  Chaque appareil enregistré ici garde sa trace : qui l'a vendu, son
                  état, son coût, sa marge. Aucune saisie tableur ; tout tient en deux
                  minutes.
                </>
              }
              action={
                <Link
                  to="/add-phone"
                  className="btn-magnetic inline-flex items-center gap-2 px-5 py-3 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  Enregistrer un téléphone
                </Link>
              }
            />
            <GhostBand>
              <div className="space-y-2">
                {GHOST_PHONES.map((p) => (
                  <GhostPhoneRow key={p.id} phone={p} />
                ))}
              </div>
            </GhostBand>
          </>
        ) : filtered.length === 0 ? (
          <div className="card-soft rounded-lg py-16 text-center">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Aucun résultat
            </div>
            <p className="text-sm text-muted-foreground">
              {search ? `Aucun téléphone ne correspond à « ${search} ».` : "Aucun téléphone avec ce filtre."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((phone) => (
              <PhoneCard
                key={phone.id}
                phone={phone}
                onToggleStatus={(id, status) =>
                  toggleStatusMutation.mutate({ id, currentStatus: status })
                }
                onDelete={(id) => {
                  if (window.confirm("Êtes-vous sûr de vouloir supprimer ce téléphone ?")) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </PageMotion>
    </Layout>
  );
}

function PhoneCard({
  phone,
  onToggleStatus,
  onDelete,
}: {
  phone: Phone;
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const margin = phone.resalePrice - phone.purchasePrice - phone.repairPrice;
  const isSold = phone.status === "sold";

  return (
    <article className="card-soft rounded-lg overflow-hidden transition-all duration-500 ease-out-expo hover:-translate-y-px">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-md bg-secondary border hairline-border overflow-hidden flex-shrink-0">
          {phone.photoUrl ? (
            <img src={phone.photoUrl} alt={phone.model} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
              <SmartphoneIcon className="w-5 h-5" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg text-foreground tracking-tight truncate">
              {phone.model}
            </h3>
            <span
              className={`text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
                isSold
                  ? "bg-success/10 text-success"
                  : "bg-foreground/8 text-primary"
              }`}
            >
              {isSold ? "Vendu" : "En vente"}
            </span>
          </div>
          <div className="text-[12px] text-muted-foreground mt-1 truncate">
            {phone.seller.firstName} {phone.seller.lastName} ·{" "}
            <span className="text-muted-foreground/70">{phone.seller.village}</span>{" "}
            · <span className="text-muted-foreground/70">{phone.condition}</span>
          </div>
          {phone.imei && (
            <div className="text-[10px] text-muted-foreground/60 font-mono tabular mt-0.5 truncate">
              IMEI {phone.imei}
            </div>
          )}
        </div>

        <div className="hidden sm:block text-right min-w-[120px]">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Marge</div>
          <div
            className={`font-display tabular text-xl ${
              margin >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {margin >= 0 ? "+" : ""}
            {eur(margin)}
          </div>
        </div>

        <ChevronDown
          strokeWidth={1.5}
          className={`w-4 h-4 text-muted-foreground transition-transform duration-500 ease-out-expo ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t hairline-border bg-secondary/20">
          <div className="grid grid-cols-3 divide-x hairline-border">
            <DetailCell label="Achat" value={eur(phone.purchasePrice)} />
            <DetailCell label="Réparation" value={eur(phone.repairPrice)} />
            <DetailCell label="Revente" value={eur(phone.resalePrice)} />
          </div>
          <div className="flex items-center gap-3 p-4 border-t hairline-border">
            <button
              onClick={() => onToggleStatus(phone.id, phone.status)}
              className="btn-magnetic flex items-center gap-2 px-4 py-2 ink-surface rounded-md text-[12px] font-medium hover:bg-ink/90"
            >
              {isSold ? (
                <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
              )}
              {isSold ? "Remettre en vente" : "Marquer vendu"}
            </button>
            <button
              onClick={() => onDelete(phone.id)}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-[12px] text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" strokeWidth={2} />
              Supprimer
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display tabular text-lg text-foreground mt-1">{value}</div>
    </div>
  );
}

function GhostPhoneRow({
  phone,
}: {
  phone: {
    model: string;
    condition: string;
    seller: { firstName: string; lastName: string; village: string };
    purchase: number;
    repair: number;
    resale: number;
    status: "for_sale" | "sold";
  };
}) {
  const margin = phone.resale - phone.purchase - phone.repair;
  const isSold = phone.status === "sold";
  return (
    <article className="card-soft rounded-lg p-4 flex items-center gap-4">
      <div className="w-14 h-14 rounded-md bg-secondary border hairline-border flex items-center justify-center text-muted-foreground/40">
        <SmartphoneIcon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg text-foreground tracking-tight truncate">
            {phone.model}
          </h3>
          <span
            className={`text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
              isSold ? "bg-success/10 text-success" : "bg-foreground/8 text-foreground"
            }`}
          >
            {isSold ? "Vendu" : "En vente"}
          </span>
        </div>
        <div className="text-[12px] text-muted-foreground mt-1 truncate">
          {phone.seller.firstName} {phone.seller.lastName} ·{" "}
          <span className="text-muted-foreground/70">{phone.seller.village}</span> ·{" "}
          <span className="text-muted-foreground/70">{phone.condition}</span>
        </div>
      </div>
      <div className="hidden sm:block text-right min-w-[120px]">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Marge</div>
        <div className="font-display tabular text-xl text-foreground">+{eur(margin)}</div>
      </div>
    </article>
  );
}
