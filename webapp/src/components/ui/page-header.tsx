import { ReactNode } from "react";

type Props = {
  num: string;
  kicker: string;
  title: string;
  emphasis?: string; // optional italic word or phrase
  trailing?: string; // trailing piece (eg. ".")
  subline?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ num, kicker, title, emphasis, trailing = ".", subline, actions }: Props) {
  return (
    <header className="space-y-6 pt-2 md:pt-6">
      <div className="flex items-baseline gap-3">
        <span className="font-mono-kicker text-[10px] text-muted-foreground">
          {num} — {kicker}
        </span>
        <span className="h-px flex-1 max-w-[120px] bg-hairline self-center" />
        <span className="font-mono-kicker text-[9px] text-muted-foreground/50 tabular">
          {new Date().toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="max-w-[680px]">
          <h1 className="font-heading text-[clamp(2.4rem,4.5vw,3.5rem)] leading-[1.02] text-foreground">
            {title}
            {emphasis && (
              <>
                {" "}
                <span className="italic">{emphasis}</span>
              </>
            )}
            <span className="text-primary not-italic">{trailing}</span>
          </h1>
          {subline && <div className="mt-3 text-sm text-muted-foreground max-w-md">{subline}</div>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
