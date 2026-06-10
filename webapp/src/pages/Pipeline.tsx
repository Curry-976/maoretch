import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Tag,
  CheckCircle2,
  Wrench,
  Plus,
  Smartphone as SmartphoneIcon,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { Phone } from "@/lib/types";
import { Layout } from "@/components/Layout";

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

type LaneKey = "to_repair" | "for_sale" | "sold";

const lanes: { key: LaneKey; label: string; description: string; accent: string; icon: any }[] = [
  {
    key: "to_repair",
    label: "À réparer",
    description: "État : à réparer",
    accent: "warning",
    icon: Wrench,
  },
  {
    key: "for_sale",
    label: "En vente",
    description: "Disponible à la vente",
    accent: "primary",
    icon: Tag,
  },
  {
    key: "sold",
    label: "Vendu",
    description: "Cession finalisée",
    accent: "success",
    icon: CheckCircle2,
  },
];

const accentClasses: Record<string, { dot: string; text: string }> = {
  warning: { dot: "bg-warning", text: "text-warning" },
  primary: { dot: "bg-primary", text: "text-primary" },
  success: { dot: "bg-success", text: "text-success" },
};

export default function Pipeline() {
  const queryClient = useQueryClient();

  const { data: phones = [], isLoading } = useQuery({
    queryKey: ["phones"],
    queryFn: () => api.get<Phone[]>("/api/phones"),
  });

  const grouped = useMemo(() => {
    return {
      to_repair: phones.filter((p) => p.condition === "À réparer" && p.status !== "sold"),
      for_sale: phones.filter((p) => p.condition !== "À réparer" && p.status === "for_sale"),
      sold: phones.filter((p) => p.status === "sold"),
    };
  }, [phones]);

  const totals = {
    to_repair: grouped.to_repair.reduce((s, p) => s + p.purchasePrice + p.repairPrice, 0),
    for_sale: grouped.for_sale.reduce((s, p) => s + p.resalePrice, 0),
    sold: grouped.sold.reduce((s, p) => s + p.resalePrice, 0),
  };

  const markAsSold = useMutation({
    mutationFn: (id: string) => api.patch<Phone>(`/api/phones/${id}`, { status: "sold" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Téléphone marqué comme vendu");
    },
  });

  const markAsForSale = useMutation({
    mutationFn: (id: string) => api.patch<Phone>(`/api/phones/${id}`, { status: "for_sale" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Téléphone remis en vente");
    },
  });

  const totalPhones = phones.length;
  const totalValue = totals.to_repair + totals.for_sale + totals.sold;

  return (
    <Layout>
      <div className="px-6 md:px-10 py-6 md:py-8 space-y-6 max-w-[1600px]">
        {/* Counter rail — the title IS the data */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 border-b hairline-border">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              <span>Pipeline</span>
              <span className="text-muted-foreground/40">·</span>
              <span>Inventaire visuel</span>
            </div>
            <div className="flex items-end gap-6 flex-wrap">
              {lanes.map((lane) => {
                const n = grouped[lane.key].length;
                return (
                  <div key={lane.key} className="flex items-baseline gap-2">
                    <span className="font-display tabular text-4xl text-foreground leading-none">
                      {n || "—"}
                    </span>
                    <span className="text-[12px] text-muted-foreground capitalize">{lane.label.toLowerCase()}</span>
                  </div>
                );
              })}
              <div className="ml-auto text-right">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  Valeur totale
                </div>
                <div className="font-display tabular text-2xl text-foreground tracking-tight">
                  {totalValue ? eur(totalValue) : "—"}
                </div>
              </div>
            </div>
          </div>
          <Link
            to="/add-phone"
            className="btn-magnetic inline-flex items-center gap-2 px-4 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-primary self-start"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau téléphone
          </Link>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {lanes.map((lane) => {
              const items = grouped[lane.key];
              const Icon = lane.icon;
              return (
                <div
                  key={lane.key}
                  className="card-soft rounded-lg overflow-hidden flex flex-col min-h-[400px]"
                >
                  {/* Lane header — monochrome, accent only on the dot */}
                  <div className="relative p-5 border-b hairline-border">
                    <span
                      className={`absolute left-0 top-0 bottom-0 w-[2px] ${accentClasses[lane.accent].dot}`}
                    />
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${accentClasses[lane.accent].dot}`} />
                          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                            {lane.description}
                          </span>
                        </div>
                        <h3 className="mt-2 font-display text-2xl text-foreground tracking-tight">
                          {lane.label}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="font-display tabular text-3xl text-foreground tracking-tight">
                          {items.length || "—"}
                        </div>
                      </div>
                    </div>
                    {items.length > 0 && (
                      <div className="mt-3 text-[11px] text-muted-foreground">
                        Valeur :{" "}
                        <span className="text-foreground font-medium tabular">
                          {eur(totals[lane.key])}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lane content */}
                  <div className="p-3 flex-1 space-y-2.5 max-h-[600px] overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center mb-3">
                          <Icon className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.5} />
                        </div>
                        <div className="text-[12px] text-muted-foreground">
                          Aucun appareil
                        </div>
                      </div>
                    ) : (
                      items.map((phone) => (
                        <PhoneKanbanCard
                          key={phone.id}
                          phone={phone}
                          lane={lane.key}
                          onMarkSold={() => markAsSold.mutate(phone.id)}
                          onMarkForSale={() => markAsForSale.mutate(phone.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </Layout>
  );
}

function PhoneKanbanCard({
  phone,
  lane,
  onMarkSold,
  onMarkForSale,
}: {
  phone: Phone;
  lane: LaneKey;
  onMarkSold: () => void;
  onMarkForSale: () => void;
}) {
  const margin = phone.resalePrice - phone.purchasePrice - phone.repairPrice;

  return (
    <article className="group bg-card border hairline-border rounded-md p-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out-expo">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-md bg-secondary border hairline-border overflow-hidden flex-shrink-0">
          {phone.photoUrl ? (
            <img src={phone.photoUrl} alt={phone.model} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
              <SmartphoneIcon className="w-4 h-4" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground text-[13px] truncate">{phone.model}</div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
            {phone.seller.firstName} {phone.seller.lastName}
          </div>
          <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mt-0.5">
            {phone.seller.village} · {phone.condition}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t hairline-border flex items-center justify-between gap-2">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {lane === "sold" ? "Vendu" : "Marge prév."}
          </div>
          <div
            className={`font-display tabular text-base ${
              margin >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {lane === "sold" ? eur(phone.resalePrice) : `${margin >= 0 ? "+" : ""}${eur(margin)}`}
          </div>
        </div>
        {lane !== "sold" ? (
          <button
            onClick={onMarkSold}
            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2.5 py-1.5 ink-surface rounded text-[10px] font-medium hover:bg-primary transition-all duration-300 ease-out-expo"
          >
            Marquer vendu
            <ArrowRight className="w-2.5 h-2.5" strokeWidth={2} />
          </button>
        ) : (
          <button
            onClick={onMarkForSale}
            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2.5 py-1.5 border hairline-border rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all duration-300 ease-out-expo"
          >
            Remettre en vente
          </button>
        )}
      </div>
    </article>
  );
}
