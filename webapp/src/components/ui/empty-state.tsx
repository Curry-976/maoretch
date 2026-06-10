import { ReactNode } from "react";

type Props = {
  kicker: string;
  title: ReactNode;
  body: ReactNode;
  illustration?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ kicker, title, body, illustration, action }: Props) {
  return (
    <section className="border hairline rounded-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-0">
        <div className="p-10 md:p-14 space-y-6 max-w-[520px]">
          <div className="font-mono-kicker text-[10px] text-muted-foreground">{kicker}</div>
          <h2 className="font-heading text-4xl leading-[1.05] text-foreground">
            {title}
            <span className="text-primary not-italic">.</span>
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed">{body}</div>
          {action && <div className="pt-2">{action}</div>}
        </div>
        <div className="relative border-t md:border-t-0 md:border-l hairline bg-gradient-to-br from-secondary/40 to-transparent min-h-[200px] md:min-h-[280px] flex items-center justify-center overflow-hidden">
          {illustration ?? <DefaultIllustration />}
        </div>
      </div>
    </section>
  );
}

function DefaultIllustration() {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      className="w-48 h-48 opacity-30"
      aria-hidden
    >
      <rect x="80" y="40" width="80" height="160" rx="14" stroke="currentColor" strokeWidth="1" />
      <g stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.5">
        <line x1="120" y1="80" x2="120" y2="160" />
        <line x1="85" y1="100" x2="155" y2="140" />
        <line x1="85" y1="140" x2="155" y2="100" />
        <line x1="78" y1="120" x2="162" y2="120" />
      </g>
      <circle cx="120" cy="120" r="4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
