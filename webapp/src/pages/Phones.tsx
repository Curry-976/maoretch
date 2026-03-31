import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Phone } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { toast } from "sonner";
import { Search, Trash2, CheckCircle, ShoppingCart, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function conditionColor(condition: string) {
  if (condition === "Neuf") return "text-green-400 bg-green-400/10";
  if (condition === "Très bon état") return "text-blue-400 bg-blue-400/10";
  if (condition === "Bon état") return "text-yellow-400 bg-yellow-400/10";
  if (condition === "Usagé") return "text-orange-400 bg-orange-400/10";
  return "text-red-400 bg-red-400/10";
}

function PhoneCard({ phone, onToggleStatus, onDelete }: {
  phone: Phone;
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const margin = phone.resalePrice - phone.purchasePrice - phone.repairPrice;
  const isSold = phone.status === "sold";

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${isSold ? "border-border opacity-75" : "border-border hover:border-primary/30"}`}>
      <div className="p-4 flex gap-4">
        {/* Photo */}
        <div className="w-16 h-16 rounded-lg bg-secondary flex-shrink-0 overflow-hidden">
          {phone.photoUrl ? (
            <img src={phone.photoUrl} alt={phone.model} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">📱</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground truncate">{phone.model}</h3>
              <p className="text-sm text-muted-foreground">{phone.seller.firstName} {phone.seller.lastName} · {phone.seller.village}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${conditionColor(phone.condition)}`}>
                {phone.condition}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isSold ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
              }`}>
                {isSold ? "Vendu" : "En vente"}
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Achat: <span className="text-foreground">{formatCurrency(phone.purchasePrice)}</span></span>
            <span className="text-sm text-muted-foreground">Revente: <span className="text-foreground">{formatCurrency(phone.resalePrice)}</span></span>
            <span className={`flex items-center gap-1 text-sm font-medium ${margin >= 0 ? "text-green-400" : "text-destructive"}`}>
              {margin >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {margin >= 0 ? "+" : ""}{formatCurrency(margin)}
            </span>
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="self-start text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 bg-secondary/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-card rounded-lg">
              <p className="text-xs text-muted-foreground">Prix d'achat</p>
              <p className="font-semibold text-foreground">{formatCurrency(phone.purchasePrice)}</p>
            </div>
            <div className="p-3 bg-card rounded-lg">
              <p className="text-xs text-muted-foreground">Réparation</p>
              <p className="font-semibold text-foreground">{formatCurrency(phone.repairPrice)}</p>
            </div>
            <div className="p-3 bg-card rounded-lg">
              <p className="text-xs text-muted-foreground">Prix revente</p>
              <p className="font-semibold text-foreground">{formatCurrency(phone.resalePrice)}</p>
            </div>
            <div className={`p-3 rounded-lg ${margin >= 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
              <p className="text-xs text-muted-foreground">Marge</p>
              <p className={`font-bold ${margin >= 0 ? "text-green-400" : "text-destructive"}`}>
                {margin >= 0 ? "+" : ""}{formatCurrency(margin)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleStatus(phone.id, phone.status)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isSold
                  ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                  : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
              }`}
            >
              {isSold ? <ShoppingCart className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {isSold ? "Remettre en vente" : "Marquer comme vendu"}
            </button>
            <button
              onClick={() => onDelete(phone.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>
      )}
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
      `${p.seller.firstName} ${p.seller.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      p.seller.village.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: phones.length,
    forSale: phones.filter((p) => p.status === "for_sale").length,
    sold: phones.filter((p) => p.status === "sold").length,
    totalMargin: phones.filter(p => p.status === "sold").reduce((s, p) => s + p.resalePrice - p.purchasePrice - p.repairPrice, 0),
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-wide">GESTION TÉLÉPHONES</h1>
          <p className="text-muted-foreground mt-1">{phones.length} téléphone{phones.length > 1 ? "s" : ""} enregistré{phones.length > 1 ? "s" : ""}</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: String(stats.total), color: "text-foreground" },
            { label: "En vente", value: String(stats.forSale), color: "text-yellow-400" },
            { label: "Vendus", value: String(stats.sold), color: "text-green-400" },
            { label: "Bénéfice total", value: formatCurrency(stats.totalMargin), color: stats.totalMargin >= 0 ? "text-green-400" : "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par modèle, vendeur..."
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "for_sale", "sold"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "Tous" : f === "for_sale" ? "En vente" : "Vendus"}
              </button>
            ))}
          </div>
        </div>

        {/* Phone list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3"></div>
            <p className="text-muted-foreground">
              {search || filter !== "all" ? "Aucun téléphone trouvé" : "Aucun téléphone enregistré"}
            </p>
            {!search && filter === "all" && (
              <a href="/add-phone" className="mt-4 text-primary text-sm hover:underline">Ajouter votre premier téléphone →</a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((phone) => (
              <PhoneCard
                key={phone.id}
                phone={phone}
                onToggleStatus={(id, status) => toggleStatusMutation.mutate({ id, currentStatus: status })}
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
