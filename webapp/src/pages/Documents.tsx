import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, Receipt, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { SalesDocument, DocumentStatus } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { PageMotion } from "@/components/ui/page-motion";
import { CountUp } from "@/components/ui/count-up";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type TypeFilter = "all" | "quote" | "invoice";

const TYPE_TABS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "quote", label: "Devis" },
  { key: "invoice", label: "Factures" },
];

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const statusConfig: Record<DocumentStatus, { label: string; classes: string }> = {
  draft: {
    label: "Brouillon",
    classes: "bg-foreground/8 text-foreground",
  },
  sent: {
    label: "Envoyé",
    classes: "bg-foreground/10 text-foreground",
  },
  accepted: {
    label: "Accepté",
    classes: "bg-success/10 text-success",
  },
  paid: {
    label: "Payé",
    classes: "bg-success/10 text-success",
  },
  cancelled: {
    label: "Annulé",
    classes: "bg-destructive/8 text-destructive",
  },
};

export default function Documents() {
  const [tab, setTab] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get<SalesDocument[]>("/api/documents"),
  });

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (tab !== "all" && d.type !== tab) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        d.number.toLowerCase().includes(s) ||
        d.clientName.toLowerCase().includes(s) ||
        (d.clientEmail?.toLowerCase().includes(s) ?? false)
      );
    });
  }, [documents, tab, search]);

  const counts = useMemo(
    () => ({
      all: documents.length,
      quote: documents.filter((d) => d.type === "quote").length,
      invoice: documents.filter((d) => d.type === "invoice").length,
    }),
    [documents],
  );

  const totals = useMemo(
    () => ({
      invoiced: documents
        .filter((d) => d.type === "invoice")
        .reduce((s, d) => s + d.total, 0),
      paid: documents
        .filter((d) => d.type === "invoice" && d.status === "paid")
        .reduce((s, d) => s + d.total, 0),
      pending: documents
        .filter(
          (d) =>
            d.type === "invoice" &&
            d.status !== "paid" &&
            d.status !== "cancelled",
        )
        .reduce((s, d) => s + d.total, 0),
    }),
    [documents],
  );

  return (
    <Layout>
      <PageMotion className="px-6 md:px-10 py-8 md:py-12 space-y-8 max-w-[1400px]">
        {/* Tabs-as-title */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 border-b hairline-border">
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              Comptabilité commerciale
            </div>
            <nav className="flex items-baseline gap-x-8 gap-y-2 flex-wrap" role="tablist">
              {TYPE_TABS.map((t) => {
                const active = tab === t.key;
                const count = counts[t.key];
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    role="tab"
                    aria-selected={active}
                    className={`group relative pb-2 transition-colors ${
                      active
                        ? "text-foreground"
                        : "text-foreground/35 hover:text-foreground/70"
                    }`}
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="font-display tabular text-[clamp(1.8rem,3vw,2.6rem)] leading-none tracking-tightest">
                        {count ? <CountUp value={count} /> : "—"}
                      </span>
                      <span className="text-[14px] font-medium">{t.label}</span>
                    </span>
                    {active && (
                      <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-foreground" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex gap-2 self-start">
            <Link
              to="/documents/new?type=quote"
              className="inline-flex items-center gap-2 px-4 py-2.5 border hairline-border rounded-md text-[13px] font-medium text-foreground hover:border-foreground/40 transition-all"
            >
              <FileText className="w-3.5 h-3.5" strokeWidth={2} />
              Nouveau devis
            </Link>
            <Link
              to="/documents/new?type=invoice"
              className="btn-magnetic inline-flex items-center gap-2 px-4 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Nouvelle facture
            </Link>
          </div>
        </header>

        {/* Money summary */}
        {documents.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MoneyTile label="Facturé" value={totals.invoiced} />
            <MoneyTile label="Encaissé" value={totals.paid} tone="positive" />
            <MoneyTile label="En attente" value={totals.pending} />
          </section>
        )}

        {/* Search */}
        {documents.length > 0 && (
          <div className="relative max-w-md">
            <Search
              strokeWidth={1.8}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Numéro, client, email…"
              className="w-full pl-10 pr-4 py-3 bg-card border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <SkeletonRows count={4} rowHeight="h-[82px]" />
        ) : documents.length === 0 ? (
          <EmptyState
            eyebrow="Aucun document"
            title="Premier devis ou facture"
            italic="à émettre"
            body={
              <>
                Préparez un devis pour un client intéressé, puis convertissez-le
                en facture quand il accepte. Tout le suivi des paiements se fait
                ensuite ici, en un coup d'œil.
              </>
            }
            action={
              <div className="flex gap-2">
                <Link
                  to="/documents/new?type=quote"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border hairline-border rounded-md text-[13px] font-medium text-foreground hover:border-foreground/40 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                  Nouveau devis
                </Link>
                <Link
                  to="/documents/new?type=invoice"
                  className="btn-magnetic inline-flex items-center gap-2 px-5 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  Nouvelle facture
                </Link>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <div className="card-soft rounded-lg py-16 text-center">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Aucun résultat
            </div>
            <p className="text-sm text-muted-foreground">
              {search
                ? `Aucun document ne correspond à « ${search} ».`
                : "Aucun document avec ce filtre."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </PageMotion>
    </Layout>
  );
}

function MoneyTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "positive";
}) {
  return (
    <div className="card-soft rounded-lg p-5">
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
        {label}
      </div>
      <div
        className={`mt-2 font-display tabular text-3xl tracking-tightest ${
          tone === "positive" ? "text-success" : "text-foreground"
        }`}
      >
        {value ? eur(value) : "—"}
      </div>
    </div>
  );
}

function DocumentRow({ doc }: { doc: SalesDocument }) {
  const cfg = statusConfig[doc.status];
  const isQuote = doc.type === "quote";
  return (
    <Link
      to={`/documents/${doc.id}`}
      className="card-soft rounded-lg p-4 flex items-center gap-4 hover:-translate-y-px transition-transform duration-500 ease-out-expo"
    >
      <div className="w-11 h-11 rounded-md bg-foreground/8 flex items-center justify-center text-foreground flex-shrink-0">
        {isQuote ? (
          <FileText className="w-4 h-4" strokeWidth={1.8} />
        ) : (
          <Receipt className="w-4 h-4" strokeWidth={1.8} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[12px] text-muted-foreground tabular">
            {doc.number}
          </span>
          <span className="text-foreground/30">·</span>
          <span className="font-medium text-foreground truncate">
            {doc.clientName}
          </span>
          <span
            className={`text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${cfg.classes}`}
          >
            {cfg.label}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 tabular">
          {new Date(doc.issuedAt).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          {doc.lines.length > 0 && (
            <>
              {" · "}
              {doc.lines.length} ligne{doc.lines.length > 1 ? "s" : ""}
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="font-display tabular text-xl text-foreground">
          {eur(doc.total)}
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {isQuote ? "Devis" : "Facture"}
        </div>
      </div>
      <ChevronRight
        className="w-4 h-4 text-muted-foreground/40"
        strokeWidth={1.5}
      />
    </Link>
  );
}
