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
import { PageHeader } from "@/components/ui/page-header";

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

type LaneKey = "to_repair" | "for_sale" | "sold";

const lanes: { key: LaneKey; label: string; description: string; tone: string; icon: any }[] = [
  {
    key: "to_repair",
    label: "À réparer",
    description: "État : à réparer",
    tone: "from-warning/20 to-warning/0",
    icon: Wrench,
  },
  {
    key: "for_sale",
    label: "En vente",
    description: "Disponible à la vente",
    tone: "from-primary/20 to-primary/0",
    icon: Tag,
  },
  {
    key: "sold",
    label: "Vendu",
    description: "Cession finalisée",
    tone: "from-success/20 to-success/0",
    icon: CheckCircle2,
  },
];

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

  return (
    <Layout>
      <div className="px-6 md:px-10 py-8 md:py-12 space-y-10 max-w-[1600px]">
        <PageHeader
          eyebrow="Pipeline visuel"
          title="Le parcours"
          italic="de chaque appareil."
          subline="Du téléphone à réparer jusqu'à la vente finale. Chaque carte représente un appareil ; cliquez pour faire avancer son statut."
          actions={
            <Link
              to="/add-phone"
              className="btn-magnetic inline-flex items-center gap-2 px-4 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-primary"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Nouveau téléphone
            </Link>
          }
        />

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
                  {/* Lane header */}
                  <div
                    className={`relative p-5 border-b hairline-border bg-gradient-to-b ${lane.tone}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-foreground" strokeWidth={1.8} />
                          <h3 className="font-display text-xl text-foreground tracking-tight">
                            {lane.label}
                          </h3>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {lane.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display tabular text-2xl text-foreground tracking-tight">
                          {items.length}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {items.length > 1 ? "Appareils" : "Appareil"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-[12px] text-muted-foreground">
                      Valeur :{" "}
                      <span className="text-foreground font-medium tabular">
                        {eur(totals[lane.key])}
                      </span>
                    </div>
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
