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
} from "lucide-react";
import { api } from "@/lib/api";
import { Phone } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatStrip } from "@/components/ui/stat-strip";
import { EmptyState } from "@/components/ui/empty-state";

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
    <article
      className={`group border hairline transition-all duration-500 ease-out-expo ${
        isSold ? "opacity-65 hover:opacity-90" : "hover:border-primary/40"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-5 flex items-center gap-5"
      >
        {/* Photo */}
        <div className="w-14 h-14 flex-shrink-0 border hairline overflow-hidden">
          {phone.photoUrl ? (
            <img src={phone.photoUrl} alt={phone.model} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
              <SmartphoneIcon className="w-5 h-5" strokeWidth={1.2} />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <h3 className="font-heading text-2xl text-foreground leading-none truncate">
              {phone.model}
            </h3>
            <span
              className={`font-mono-kicker text-[9px] ${
                isSold ? "text-success" : "text-muted-foreground"
              }`}
            >
              {isSold ? "Vendu" : "En vente"}
            </span>
          </div>
          <div className="mt-1.5 text-[12px] text-muted-foreground">
            {phone.seller.firstName} {phone.seller.lastName} ·{" "}
            <span className="text-muted-foreground/70">{phone.seller.village}</span>{" "}
            · <span className="text-muted-foreground/70">{phone.condition}</span>
          </div>
        </div>

        {/* Margin */}
        <div className="hidden sm:flex flex-col items-end gap-1 min-w-[140px]">
          <div className="font-mono-kicker text-[9px] text-muted-foreground">Marge</div>
          <div
            className={`font-heading text-3xl tabular leading-none ${
              margin >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {margin >= 0 ? "+" : ""}
            {eur(margin)}
          </div>
        </div>

        <ChevronDown
          strokeWidth={1.2}
          className={`w-4 h-4 text-muted-foreground transition-transform duration-500 ease-out-expo ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t hairline">
          <div className="grid grid-cols-3 divide-x divide-hairline">
            <DetailCell kicker="Achat" value={eur(phone.purchasePrice)} />
            <DetailCell kicker="Réparation" value={eur(phone.repairPrice)} />
            <DetailCell kicker="Revente" value={eur(phone.resalePrice)} />
          </div>
          <div className="flex items-center gap-3 p-5 border-t hairline">
            <button
              onClick={() => onToggleStatus(phone.id, phone.status)}
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-mono-kicker border hairline hover:border-foreground/60 text-foreground transition-all duration-500 ease-out-expo"
            >
              {isSold ? (
                <ShoppingCart className="w-3 h-3" strokeWidth={1.5} />
              ) : (
                <CheckCircle className="w-3 h-3" strokeWidth={1.5} />
              )}
              {isSold ? "Remettre en vente" : "Marquer vendu"}
            </button>
            <button
              onClick={() => onDelete(phone.id)}
              className="ml-auto flex items-center gap-2 px-4 py-2 text-[11px] font-mono-kicker border hairline hover:border-destructive/60 text-muted-foreground hover:text-destructive transition-all duration-500 ease-out-expo"
            >
              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
              Supprimer
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function DetailCell({ kicker, value }: { kicker: string; value: string }) {
  return (
    <div className="p-5">
      <div className="font-mono-kicker text-[9px] text-muted-foreground">{kicker}</div>
      <div className="font-heading text-xl text-foreground mt-1 tabular">{value}</div>
    </div>
  );
}

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
    totalMargin: phones
      .filter((p) => p.status === "sold")
      .reduce((s, p) => s + p.resalePrice - p.purchasePrice - p.repairPrice, 0),
    revenue: phones
      .filter((p) => p.status === "sold")
      .reduce((s, p) => s + p.resalePrice, 0),
  };

  const hasData = phones.length > 0;

  return (
    <Layout>
      <div className="px-6 md:px-10 py-8 md:py-10 space-y-14 max-w-[1400px]">
        <PageHeader
          num="03"
          kicker="Inventaire"
          title="Tous les"
          emphasis="téléphones"
          subline={
            hasData
              ? `${phones.length} appareil${phones.length > 1 ? "s" : ""} suivi${
                  phones.length > 1 ? "s" : ""
                }, du démarchage à la vente finale.`
              : "Quand un téléphone passe ici, c'est qu'il a été acheté à un vendeur. La vie de l'appareil démarre ce jour-là."
          }
          actions={
            <Link
              to="/add-phone"
              className="group flex items-center gap-2 px-4 py-2.5 border hairline hover:border-primary text-foreground text-xs font-mono-kicker transition-all duration-500 ease-out-expo"
            >
              <Plus className="w-3 h-3" strokeWidth={1.5} />
              Nouveau
              <span className="opacity-50 group-hover:translate-x-0.5 transition-transform duration-500 ease-out-expo">
                →
              </span>
            </Link>
          }
        />

        {hasData && (
          <>
            <StatStrip
              hero={{
                kicker: "Chiffre d'affaires généré",
                value: eur(stats.revenue),
                sub: `${stats.sold} téléphone${stats.sold > 1 ? "s" : ""} vendu${
                  stats.sold > 1 ? "s" : ""
                }`,
              }}
              stats={[
                {
                  kicker: "En vente",
                  value: String(stats.forSale),
                  sub: "Disponibles maintenant",
                },
                {
                  kicker: "Bénéfice total",
                  value: eur(stats.totalMargin),
                  sub: "Hors coûts indirects",
                  emphasis: stats.totalMargin >= 0 ? "positive" : "negative",
                },
                {
                  kicker: "Total enregistré",
                  value: String(stats.total),
                  sub: "Toutes périodes confondues",
                },
              ]}
            />

            <div className="h-px bg-hairline" />
          </>
        )}

        {/* Toolbar */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 font-mono-kicker text-[10px] text-muted-foreground">
            <span>04 — Liste & filtres</span>
            <span className="h-px flex-1 bg-hairline max-w-[120px]" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 max-w-md">
              <div className="font-mono-kicker text-[9px] text-muted-foreground mb-2">
                Recherche
              </div>
              <div className="relative">
                <Search
                  strokeWidth={1.2}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Modèle, vendeur, village…"
                  className="w-full pl-6 pr-4 py-2.5 bg-transparent border-0 border-b hairline focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/40 text-sm transition-colors duration-300 ease-out-expo"
                />
              </div>
            </div>

            <div className="flex gap-0 border hairline">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 font-mono-kicker text-[10px] transition-all duration-300 ease-out-expo relative ${
                    filter === f.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasData ? (
          <EmptyState
            kicker="Inventaire vide"
            title={
              <>
                Le premier téléphone <span className="italic">n'attend que vous</span>
              </>
            }
            body={
              <>
                Chaque appareil enregistré ici garde sa trace complète : qui l'a vendu, dans
                quel village, son état, son coût, sa marge. Aucune saisie tableur ; tout
                tient en deux minutes.
              </>
            }
            action={
              <Link
                to="/add-phone"
                className="group inline-flex items-center gap-2 px-5 py-3 border hairline hover:border-primary text-foreground text-sm font-medium transition-all duration-500 ease-out-expo"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                Enregistrer un téléphone
                <span className="font-mono-kicker text-[9px] text-muted-foreground group-hover:translate-x-1 transition-transform duration-500 ease-out-expo">
                  →
                </span>
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <div className="border hairline py-16 text-center space-y-3">
            <div className="font-mono-kicker text-[10px] text-muted-foreground">
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
      </div>
    </Layout>
  );
}
