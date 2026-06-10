import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  Send,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { DocumentStatus, SalesDocument } from "@/lib/types";
import { Layout } from "@/components/Layout";

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

const statusLabel: Record<DocumentStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  paid: "Payé",
  cancelled: "Annulé",
};

export default function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: () => api.get<SalesDocument>(`/api/documents/${id}`),
  });

  const setStatusMut = useMutation({
    mutationFn: (status: DocumentStatus) =>
      api.patch<SalesDocument>(`/api/documents/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Statut mis à jour");
    },
  });

  const convertMut = useMutation({
    mutationFn: () =>
      api.post<SalesDocument>(`/api/documents/${id}/convert-to-invoice`, {}),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(`Facture ${invoice.number} créée`);
      navigate(`/documents/${invoice.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document supprimé");
      navigate("/documents");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!doc) {
    return (
      <Layout>
        <div className="text-center py-20 text-muted-foreground">Document introuvable.</div>
      </Layout>
    );
  }

  const isQuote = doc.type === "quote";

  return (
    <Layout>
      <div className="print:hidden">
        <div className="px-6 md:px-10 py-6 border-b hairline-border flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/documents")}
            className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={2} />
            Tous les documents
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Status quick actions */}
            {doc.status === "draft" && (
              <button
                onClick={() => setStatusMut.mutate("sent")}
                className="inline-flex items-center gap-1.5 px-3 py-2 border hairline-border rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all"
              >
                <Send className="w-3 h-3" strokeWidth={2} />
                Marquer envoyé
              </button>
            )}
            {isQuote && doc.status === "sent" && (
              <button
                onClick={() => setStatusMut.mutate("accepted")}
                className="inline-flex items-center gap-1.5 px-3 py-2 border hairline-border rounded-md text-[12px] font-medium text-success hover:border-success/40 transition-all"
              >
                <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                Marquer accepté
              </button>
            )}
            {isQuote && doc.status === "accepted" && (
              <button
                onClick={() => convertMut.mutate()}
                disabled={convertMut.isPending}
                className="btn-magnetic inline-flex items-center gap-1.5 px-3 py-2 ink-surface rounded-md text-[12px] font-medium hover:bg-ink/90 disabled:opacity-50"
              >
                {convertMut.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Receipt className="w-3 h-3" strokeWidth={2} />
                )}
                Convertir en facture
              </button>
            )}
            {!isQuote && doc.status !== "paid" && doc.status !== "cancelled" && (
              <button
                onClick={() => setStatusMut.mutate("paid")}
                className="btn-magnetic inline-flex items-center gap-1.5 px-3 py-2 ink-surface rounded-md text-[12px] font-medium hover:bg-ink/90"
              >
                <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                Marquer payé
              </button>
            )}
            {doc.status === "paid" && (
              <button
                onClick={() => setStatusMut.mutate("sent")}
                className="inline-flex items-center gap-1.5 px-3 py-2 border hairline-border rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all"
              >
                <RotateCcw className="w-3 h-3" strokeWidth={2} />
                Annuler paiement
              </button>
            )}
            <button
              onClick={() => navigate(`/documents/${doc.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border hairline-border rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all"
            >
              <Pencil className="w-3 h-3" strokeWidth={2} />
              Modifier
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 border hairline-border rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all"
            >
              <Printer className="w-3 h-3" strokeWidth={2} />
              Imprimer / PDF
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border hairline-border rounded-md text-[12px] font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all"
            >
              <Trash2 className="w-3 h-3" strokeWidth={2} />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Printable area */}
      <article className="document-print mx-auto my-6 md:my-10 max-w-[860px] bg-card rounded-lg border hairline-border print:border-0 print:rounded-none print:my-0 print:max-w-none">
        <div className="p-8 md:p-12 print:p-12 space-y-10 text-foreground">
          {/* Top — issuer + document meta */}
          <header className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-1">
              <div className="font-display text-2xl text-foreground tracking-tight">
                Maore-Tech
              </div>
              <div className="text-[12px] text-muted-foreground leading-relaxed">
                Mamoudzou, Mayotte (976)
                <br />
                Reseller de téléphones — outil interne
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
                {isQuote ? "Devis" : "Facture"}
              </div>
              <div className="font-mono text-lg text-foreground tabular">
                {doc.number}
              </div>
              <div className="text-[12px] text-muted-foreground tabular">
                Émis le{" "}
                {new Date(doc.issuedAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              {doc.dueAt && (
                <div className="text-[12px] text-muted-foreground tabular">
                  Échéance :{" "}
                  {new Date(doc.dueAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
              <div className="pt-1 inline-flex">
                <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-foreground/10 text-foreground">
                  {statusLabel[doc.status]}
                </span>
              </div>
            </div>
          </header>

          {/* Client */}
          <section className="border-t hairline-border pt-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium mb-2">
              Facturé à
            </div>
            <div className="space-y-0.5 text-[14px]">
              <div className="font-medium">{doc.clientName}</div>
              {doc.clientAddress && (
                <div className="text-muted-foreground">{doc.clientAddress}</div>
              )}
              {doc.clientEmail && (
                <div className="text-muted-foreground">{doc.clientEmail}</div>
              )}
              {doc.clientPhone && (
                <div className="text-muted-foreground tabular">{doc.clientPhone}</div>
              )}
            </div>
          </section>

          {/* Lines */}
          <section className="border-t hairline-border pt-6">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="text-left pb-3 font-medium">Désignation</th>
                  <th className="text-right pb-3 font-medium w-20">Qté</th>
                  <th className="text-right pb-3 font-medium w-28">PU</th>
                  <th className="text-right pb-3 font-medium w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border">
                {doc.lines.map((l) => (
                  <tr key={l.id} className="align-top">
                    <td className="py-3 pr-4">
                      <div className="text-foreground font-medium">{l.label}</div>
                      {l.description && (
                        <div className="text-muted-foreground text-[12px] mt-0.5">
                          {l.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right tabular">{l.quantity}</td>
                    <td className="py-3 text-right tabular">{eur(l.unitPrice)}</td>
                    <td className="py-3 text-right tabular font-medium">
                      {eur(l.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Totals */}
          <section className="flex justify-end">
            <div className="w-full sm:w-80 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="tabular">{eur(doc.subtotal)}</span>
              </div>
              {doc.taxRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    TVA {doc.taxRate}%
                  </span>
                  <span className="tabular">{eur(doc.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t hairline-border">
                <span className="font-medium text-foreground">Total TTC</span>
                <span className="font-display tabular text-2xl text-foreground tracking-tightest">
                  {eur(doc.total)}
                </span>
              </div>
            </div>
          </section>

          {/* Notes + terms */}
          {(doc.notes || doc.paymentTerms) && (
            <section className="border-t hairline-border pt-6 space-y-4 text-[12px] text-muted-foreground leading-relaxed">
              {doc.notes && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] font-medium mb-1.5">
                    Notes
                  </div>
                  <p className="whitespace-pre-wrap">{doc.notes}</p>
                </div>
              )}
              {doc.paymentTerms && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] font-medium mb-1.5">
                    Conditions de paiement
                  </div>
                  <p>{doc.paymentTerms}</p>
                </div>
              )}
            </section>
          )}

          {/* Footer */}
          <footer className="border-t hairline-border pt-5 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Maore-Tech · Mamoudzou, Mayotte 976
          </footer>
        </div>
      </article>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="card-elevated bg-card rounded-lg max-w-sm w-full p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-destructive font-medium">
                Suppression
              </div>
              <h2 className="font-display text-2xl text-foreground tracking-tight mt-1">
                Supprimer {isQuote ? "ce devis" : "cette facture"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le document <strong className="text-foreground">{doc.number}</strong>{" "}
              sera définitivement supprimé. Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t hairline-border">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-[12px] text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteMut.mutate()}
                disabled={deleteMut.isPending}
                className="btn-magnetic inline-flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-md text-[12px] font-medium hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteMut.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Confirmer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
