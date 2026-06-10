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
import { EmptyState } from "@/components/ui/empty-state";
import { GhostBand } from "@/components/ui/ghost-band";
import { GHOST_ACTIVITY } from "@/lib/ghosts";

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
    bg: "bg-foreground/8",
    iconColor: "text-foreground",
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

  // Build 7-day strip with per-day event counts
  const daysStrip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const dayEvents = events.filter((e) => new Date(e.timestamp).toDateString() === key);
    return {
      date: d,
      isToday: i === 6,
      count: dayEvents.length,
      dayLabel: d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
      dayNum: d.getDate(),
    };
  });
  const maxCount = Math.max(...daysStrip.map((d) => d.count), 1);
  const totalWeek = daysStrip.reduce((s, d) => s + d.count, 0);

  return (
    <Layout>
      <div className="px-6 md:px-10 py-8 md:py-12 space-y-10 max-w-[1100px]">
        {/* Calendar strip — the strip IS the title */}
        <header className="space-y-5 pb-8 border-b hairline-border">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              7 derniers jours
            </div>
            <div className="text-[12px] text-muted-foreground">
              <span className="font-display tabular text-foreground text-2xl mr-1.5">
                {totalWeek || "—"}
              </span>
              événement{totalWeek > 1 ? "s" : ""} cette semaine
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {daysStrip.map((d, i) => {
              const intensity = maxCount > 0 ? d.count / maxCount : 0;
              return (
                <div
                  key={i}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-md border transition-all ${
                    d.isToday ? "border-foreground/40 bg-card" : "hairline-border bg-card/50"
                  }`}
                >
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium capitalize">
                    {d.dayLabel}
                  </div>
                  <div className={`font-display tabular text-2xl tracking-tight ${d.isToday ? "text-foreground" : "text-foreground/70"}`}>
                    {d.dayNum}
                  </div>
                  <div className="w-full h-6 flex items-end justify-center">
                    {d.count > 0 ? (
                      <div
                        className="w-full bg-foreground/70 rounded-sm transition-all"
                        style={{ height: `${Math.max(intensity * 100, 18)}%` }}
                        title={`${d.count} événement${d.count > 1 ? "s" : ""}`}
                      />
                    ) : (
                      <div className="w-full h-px bg-hairline" />
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground tabular">
                    {d.count || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <>
            <EmptyState
              eyebrow="Aucune activité"
              title="Le journal s'écrit dès le premier"
              italic="mouvement"
              body={
                <>
                  Ajoutez un téléphone, marquez une vente, vérifiez un client — chaque
                  action viendra alimenter ce fil chronologique en temps réel.
                </>
              }
              illustration={
                <ActivityIcon className="w-32 h-32 text-foreground/15" strokeWidth={1} />
              }
            />
            <GhostBand>
              <div className="space-y-3 pl-8 relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-hairline" />
                {GHOST_ACTIVITY.map((g, i) => {
                  const cfg = typeConfig[g.type];
                  const Icon = cfg.icon;
                  return (
                    <article key={i} className="relative card-soft rounded-md p-4">
                      <div
                        className={`absolute -left-8 top-4 w-[30px] h-[30px] rounded-full ${cfg.bg} ring-4 ring-background flex items-center justify-center ${cfg.ring}`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} strokeWidth={2} />
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-foreground text-[14px]">
                            {g.title}
                          </h3>
                          {g.subtitle && (
                            <div className="text-[12px] text-muted-foreground mt-1">
                              {g.subtitle}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {g.amount !== undefined && (
                            <div className="font-display tabular text-base text-foreground">
                              {eur(g.amount)}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mt-0.5">
                            {g.when}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </GhostBand>
          </>
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
