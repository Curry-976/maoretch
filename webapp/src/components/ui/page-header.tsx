import { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  italic?: string;
  subline?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, italic, subline, actions }: Props) {
  return (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b hairline-border">
      <div className="max-w-2xl space-y-3">
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.02] tracking-tightest text-foreground text-balance">
          {title}
          {italic && (
            <>
              {" "}
              <span className="font-italic font-normal text-foreground/90">{italic}</span>
            </>
          )}
          <span className="text-primary">.</span>
        </h1>
        {subline && (
          <div className="text-[15px] text-muted-foreground leading-relaxed max-w-xl">
            {subline}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}
