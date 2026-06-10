import { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  italic?: string;
  body: ReactNode;
  illustration?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ eyebrow, title, italic, body, illustration, action }: Props) {
  return (
    <section className="card-soft rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-0">
        <div className="p-10 md:p-14 space-y-5 max-w-[560px]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              {eyebrow}
            </span>
          </div>
          <h2 className="font-display text-4xl leading-[1.05] text-foreground tracking-tightest">
            {title}
            {italic && (
              <>
                {" "}
                <span className="font-italic font-normal text-foreground/85">{italic}</span>
              </>
            )}
            <span className="text-primary">.</span>
          </h2>
          <div className="text-[15px] text-muted-foreground leading-relaxed">{body}</div>
          {action && <div className="pt-2">{action}</div>}
        </div>
        <div className="relative bg-gradient-to-br from-paper to-secondary/40 border-t md:border-t-0 md:border-l hairline-border min-h-[260px] flex items-center justify-center overflow-hidden">
          {illustration ?? <DefaultIllustration />}
        </div>
      </div>
    </section>
  );
}

function DefaultIllustration() {
  return (
    <svg viewBox="0 0 240 240" fill="none" className="w-52 h-52 text-foreground/20" aria-hidden>
      <rect x="80" y="40" width="80" height="160" rx="14" stroke="currentColor" strokeWidth="1.5" />
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <line x1="120" y1="80" x2="120" y2="160" />
        <line x1="85" y1="100" x2="155" y2="140" />
        <line x1="85" y1="140" x2="155" y2="100" />
        <line x1="78" y1="120" x2="162" y2="120" />
      </g>
      <circle cx="120" cy="120" r="5" fill="currentColor" />
    </svg>
  );
}
