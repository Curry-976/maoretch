import { ReactNode } from "react";

export function GhostBand({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 font-medium">
        <span className="h-px flex-1 bg-hairline" />
        <span className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-foreground/40" />
          Aperçu — vos données ressembleront à ça
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <div className="relative" aria-hidden="true">
        <div className="pointer-events-none select-none opacity-40 [filter:saturate(0.7)]">
          {children}
        </div>
        {/* Fade-to-background overlay at the bottom edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{
            background:
              "linear-gradient(to bottom, transparent, hsl(var(--background)) 90%)",
          }}
        />
      </div>
    </section>
  );
}
