import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  CheckCircle2,
  UserPlus,
  UserCheck,
  ShoppingCart,
  Loader2,
  Activity as ActivityIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

type Event = {
  id: string;
  type: "phone_added" | "phone_sold" | "seller_added" | "client_added" | "client_verified";
  timestamp: string;
  title: string;
  subtitle?: string;
  amount?: number;
};

const typeConfig: Record<
  Event["type"],
  { icon: any; ring: string; bg: string; iconColor: string; label: string }
> = {
  phone_added: {
    icon: Plus,
    ring: "ring-primary/20",
    bg: "bg-primary/10",
    iconColor: "text-primary",
    label: "Téléphone ajouté",
  },
  phone_sold: {
    icon: ShoppingCart,
    ring: "ring-success/20",
    bg: "bg-success/10",
    iconColor: "text-success",
    label: "Vente",
  },
  seller_added: {
    icon: UserPlus,
    ring: "ring-warning/20",
    bg: "bg-warning/10",
    iconColor: "text-warning",
    label: "Nouveau vendeur",
  },
  client_added: {
    icon: UserPlus,
    ring: "ring-secondary/40",
    bg: "bg-secondary",
    iconColor: "text-foreground",
    label: "Nouveau client",
  },
  client_verified: {
    icon: UserCheck,
    ring: "ring-success/20",
    bg: "bg-success/10",
    iconColor: "text-success",
    label: "Client vérifié",
  },
};

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHrs < 24) return `Il y a ${diffHrs} h`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function groupByDay(events: Event[]) {
  const groups: { dayLabel: string; key: string; events: Event[] }[] = [];
  for (const e of events) {
    const d = new Date(e.timestamp);
    const key = d.toDateString();
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 86400000).toDateString();

    let dayLabel = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    if (key === today) dayLabel = "Aujourd'hui";
    else if (key === yesterday) dayLabel = "Hier";

    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, dayLabel, events: [] };
      groups.push(group);
    }
    group.events.push(e);
  }
  return groups;
}

export default function Activity() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: () => api.get<Event[]>("/api/activity"),
    refetchInterval: 60_000,
  });

  const groups = groupByDay(events);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Layout>
      <div className="px-6 md:px-10 py-8 md:py-12 space-y-10 max-w-[1000px]">
        <PageHeader
          eyebrow={today}
          title="Le fil de"
          italic="votre activité"
          subline="Tout ce qui s'est passé : achats, ventes, vendeurs et clients enregistrés. Un journal continu pour ne rien rater."
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            eyebrow="Aucune activité"
            title="Le journal s'écrit dès le premier"
            italic="mouvement"
            body={
              <>
                Ajoutez un téléphone, marquez une vente, vérifiez un client — chaque action
                viendra alimenter ce fil chronologique en temps réel.
              </>
            }
            illustration={
              <ActivityIcon className="w-32 h-32 text-primary/20" strokeWidth={1} />
            }
          />
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.key} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-xl text-foreground capitalize tracking-tight">
                    {group.dayLabel}
                  </h2>
                  <div className="flex-1 h-px bg-hairline" />
                  <div className="text-[11px] text-muted-foreground tabular">
                    {group.events.length} événement{group.events.length > 1 ? "s" : ""}
                  </div>
                </div>

                <div className="relative pl-8 space-y-3">
                  {/* Vertical timeline rail */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-hairline" />

                  {group.events.map((event) => {
                    const cfg = typeConfig[event.type];
                    const Icon = cfg.icon;
                    return (
                      <article
                        key={event.id}
                        className="relative card-soft rounded-md p-4 hover:-translate-x-0.5 transition-transform duration-300 ease-out-expo"
                      >
                        {/* Dot on the rail */}
                        <div
                          className={`absolute -left-8 top-4 w-[30px] h-[30px] rounded-full ${cfg.bg} ring-4 ring-background flex items-center justify-center ${cfg.ring}`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} strokeWidth={2} />
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <h3 className="font-medium text-foreground text-[14px]">
                                {event.title}
                              </h3>
                              <span className={`text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.iconColor}`}>
                                {cfg.label}
                              </span>
                            </div>
                            {event.subtitle && (
                              <div className="text-[12px] text-muted-foreground mt-1">
                                {event.subtitle}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {event.amount !== undefined && (
                              <div className="font-display tabular text-base text-foreground">
                                {eur(event.amount)}
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mt-0.5">
                              {formatTimestamp(event.timestamp)}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
