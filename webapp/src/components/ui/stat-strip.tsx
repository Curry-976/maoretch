import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

type Stat = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: { value: number; suffix?: string };
  tone?: "default" | "positive" | "negative" | "brand";
  hero?: boolean;
};

const toneText: Record<NonNullable<Stat["tone"]>, string> = {
  default: "text-foreground",
  positive: "text-success",
  negative: "text-destructive",
  brand: "text-primary",
};

export function StatStrip({
  hero,
  stats,
  className = "",
}: {
  hero?: Stat;
  stats: Stat[];
  className?: string;
}) {
  return (
    <section className={`grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-12 ${className}`}>
      {hero && <HeroKpi stat={hero} />}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <StatTile key={i} stat={s} />
        ))}
      </div>
    </section>
  );
}

function HeroKpi({ stat }: { stat: Stat }) {
  return (
    <div className="card-soft rounded-lg p-7 lg:p-9 relative overflow-hidden">
      {/* Subtle aurora corner */}
      <div
        aria-hidden
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none opacity-50"
        style={{
          background: "radial-gradient(circle, hsl(213 78% 80% / 0.25), transparent 70%)",
        }}
      />
      <div className="relative space-y-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          {stat.label}
        </div>
        <div
          className={`font-display tabular text-[clamp(2.8rem,5vw,4.4rem)] leading-none tracking-tightest ${
            toneText[stat.tone ?? "default"]
          }`}
        >
          {stat.value}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {stat.delta && <Delta delta={stat.delta} />}
          {stat.sub && <span className="text-muted-foreground">{stat.sub}</span>}
        </div>
      </div>
    </div>
  );
}

function StatTile({ stat }: { stat: Stat }) {
  return (
    <div className="card-soft rounded-lg p-5 hover:-translate-y-0.5 transition-transform duration-500 ease-out-expo">
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
        {stat.label}
      </div>
      <div
        className={`mt-2 font-display tabular text-2xl leading-none tracking-tight ${
          toneText[stat.tone ?? "default"]
        }`}
      >
        {stat.value}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        {stat.sub && <span className="truncate">{stat.sub}</span>}
        {stat.delta && <Delta delta={stat.delta} compact />}
      </div>
    </div>
  );
}

function Delta({ delta, compact = false }: { delta: { value: number; suffix?: string }; compact?: boolean }) {
  const positive = delta.value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-medium tabular ${
        positive ? "text-success" : "text-destructive"
      } ${compact ? "text-[10px]" : "text-xs"}`}
    >
      <Icon className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {positive ? "+" : ""}
      {delta.value.toFixed(1)}%{delta.suffix ?? ""}
    </span>
  );
}
