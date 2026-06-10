import { ReactNode } from "react";

type Stat = {
  kicker: string;
  value: ReactNode;
  sub?: ReactNode;
  emphasis?: "positive" | "negative" | "neutral" | "brand";
};

const emphasisClasses: Record<NonNullable<Stat["emphasis"]>, string> = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-foreground",
  brand: "text-primary",
};

export function StatStrip({
  stats,
  hero,
  className = "",
}: {
  stats: Stat[];
  hero?: Stat & { delta?: ReactNode };
  className?: string;
}) {
  return (
    <section className={`grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 ${className}`}>
      {hero && (
        <div className="space-y-3">
          <div className="font-mono-kicker text-[10px] text-muted-foreground">{hero.kicker}</div>
          <div
            className={`font-heading text-[clamp(3.5rem,7vw,6rem)] leading-none italic tabular ${
              emphasisClasses[hero.emphasis ?? "neutral"]
            }`}
          >
            {hero.value}
          </div>
          {(hero.sub || hero.delta) && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {hero.delta && <span className="tabular">{hero.delta}</span>}
              {hero.sub && <span>{hero.sub}</span>}
            </div>
          )}
        </div>
      )}

      <div className={`grid ${stats.length <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-3"} gap-x-6 gap-y-6 self-end`}>
        {stats.map((s, i) => (
          <div key={i} className="space-y-1.5 relative">
            {i !== 0 && (
              <span className="hidden md:block absolute -left-3 top-1 bottom-1 w-px bg-hairline" />
            )}
            <div className="font-mono-kicker text-[9px] text-muted-foreground">{s.kicker}</div>
            <div
              className={`font-heading text-3xl leading-none tabular ${
                emphasisClasses[s.emphasis ?? "neutral"]
              }`}
            >
              {s.value}
            </div>
            {s.sub && <div className="text-[11px] text-muted-foreground/70">{s.sub}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
