import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Save,
  FileText,
  Receipt,
} from "lucide-react";
import { api } from "@/lib/api";
import { Client, DocumentType, Phone, SalesDocument } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { PageMotion } from "@/components/ui/page-motion";

type Line = {
  phoneId: string;
  label: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function emptyLine(): Line {
  return { phoneId: "", label: "", description: "", quantity: 1, unitPrice: 0 };
}

export default function DocumentEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [search] = useSearchParams();
  const queryClient = useQueryClient();

  const isEditing = !!id;
  const initialType = (search.get("type") as DocumentType) || "quote";
  const [type, setType] = useState<DocumentType>(initialType);
  const [number, setNumber] = useState<string>("…");

  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  const [issuedAt, setIssuedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueAt, setDueAt] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");

  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  // Pre-fill from existing document
  const { data: existing } = useQuery({
    queryKey: ["document", id],
    queryFn: () => api.get<SalesDocument>(`/api/documents/${id}`),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!existing) return;
    setType(existing.type);
    setNumber(existing.number);
    setClientId(existing.clientId ?? "");
    setClientName(existing.clientName);
    setClientEmail(existing.clientEmail ?? "");
    setClientPhone(existing.clientPhone ?? "");
    setClientAddress(existing.clientAddress ?? "");
    setIssuedAt(existing.issuedAt.slice(0, 10));
    setDueAt(existing.dueAt?.slice(0, 10) ?? "");
    setTaxRate(existing.taxRate);
    setNotes(existing.notes ?? "");
    setPaymentTerms(existing.paymentTerms ?? "");
    setLines(
      existing.lines.length
        ? existing.lines.map((l) => ({
            phoneId: l.phoneId ?? "",
            label: l.label,
            description: l.description ?? "",
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          }))
        : [emptyLine()],
    );
  }, [existing]);

  // Fetch next number for fresh documents
  useEffect(() => {
    if (isEditing) return;
    api
      .get<{ number: string }>(`/api/documents/_meta/next-number/${type}`)
      .then((r) => setNumber(r.number))
      .catch(() => setNumber("—"));
  }, [type, isEditing]);

  // Client suggestions
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get<Client[]>("/api/clients"),
  });

  // Available phones in inventory — picker fills line label + price
  const { data: phones = [] } = useQuery({
    queryKey: ["phones-for-sale"],
    queryFn: () => api.get<Phone[]>("/api/phones?status=for_sale"),
  });
  const phoneById = useMemo(
    () => Object.fromEntries(phones.map((p) => [p.id, p])),
    [phones],
  );

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
    [lines],
  );
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const upsertMut = useMutation({
    mutationFn: async () => {
      const payload = {
        type,
        clientId: clientId || undefined,
        clientName,
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        issuedAt,
        dueAt: dueAt || undefined,
        taxRate,
        notes: notes.trim() || undefined,
        paymentTerms: paymentTerms.trim() || undefined,
        lines: lines
          .filter((l) => l.label.trim())
          .map((l, i) => ({
            phoneId: l.phoneId || undefined,
            label: l.label,
            description: l.description.trim() || undefined,
            quantity: Number(l.quantity) || 0,
            unitPrice: Number(l.unitPrice) || 0,
            position: i,
          })),
      };
      if (isEditing) {
        return api.patch<SalesDocument>(`/api/documents/${id}`, payload);
      }
      return api.post<SalesDocument>("/api/documents", payload);
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", doc.id] });
      toast.success(isEditing ? "Document mis à jour" : "Document créé");
      navigate(`/documents/${doc.id}`);
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return toast.error("Le nom du client est requis");
    if (!lines.some((l) => l.label.trim())) {
      return toast.error("Ajoutez au moins une ligne valide");
    }
    upsertMut.mutate();
  };

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const pickClient = (cId: string) => {
    setClientId(cId);
    const c = clients.find((x) => x.id === cId);
    if (c) {
      setClientName(`${c.firstName} ${c.lastName}`);
      setClientEmail(c.email ?? "");
      setClientPhone(c.phone ?? "");
      setClientAddress(c.village ?? "");
    }
  };

  return (
    <Layout>
      <PageMotion className="px-6 md:px-10 py-8 md:py-12 space-y-8 max-w-[1100px]">
        <header className="space-y-5 pb-6 border-b hairline-border">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3 h-3" strokeWidth={2} />
              Retour
            </button>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              {isEditing ? "Édition" : "Nouveau document"}
            </div>
          </div>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="space-y-2">
              {!isEditing && (
                <div className="inline-flex p-1 bg-secondary/50 border hairline-border rounded-md">
                  {(["quote", "invoice"] as DocumentType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-4 py-1.5 rounded text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                        type === t
                          ? "ink-surface shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "quote" ? (
                        <FileText className="w-3 h-3" strokeWidth={2} />
                      ) : (
                        <Receipt className="w-3 h-3" strokeWidth={2} />
                      )}
                      {t === "quote" ? "Devis" : "Facture"}
                    </button>
                  ))}
                </div>
              )}
              <h1 className="font-display text-4xl text-foreground tracking-tightest">
                {type === "quote" ? "Devis" : "Facture"}{" "}
                <span className="font-mono tabular text-foreground/60">{number}</span>
              </h1>
            </div>
          </div>
        </header>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* Client */}
          <Section title="Client">
            {clients.length > 0 && (
              <div>
                <Label>Choisir un client existant (optionnel)</Label>
                <select
                  value={clientId}
                  onChange={(e) => pickClient(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="">— Saisir manuellement —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                      {c.village ? ` · ${c.village}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Nom / raison sociale *"
                value={clientName}
                onChange={setClientName}
                placeholder="Said Bacar"
              />
              <Input
                label="Email"
                value={clientEmail}
                onChange={setClientEmail}
                type="email"
                placeholder="said.bacar@example.yt"
              />
              <Input
                label="Téléphone"
                value={clientPhone}
                onChange={setClientPhone}
                type="tel"
                placeholder="+262 639 XX XX XX"
              />
              <Input
                label="Adresse / Village"
                value={clientAddress}
                onChange={setClientAddress}
                placeholder="Mamoudzou"
              />
            </div>
          </Section>

          {/* Dates */}
          <Section title="Dates">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
              <Input
                label="Date d'émission"
                value={issuedAt}
                onChange={setIssuedAt}
                type="date"
              />
              {type === "invoice" && (
                <Input
                  label="Date d'échéance"
                  value={dueAt}
                  onChange={setDueAt}
                  type="date"
                />
              )}
            </div>
          </Section>

          {/* Lines */}
          <Section title="Lignes">
            <div className="space-y-2">
              {lines.map((line, i) => (
                <article
                  key={i}
                  className="card-soft rounded-md p-3 grid grid-cols-12 gap-2 items-start"
                >
                  <div className="col-span-12 sm:col-span-5 space-y-1.5">
                    {phones.length > 0 && (
                      <select
                        value={line.phoneId}
                        onChange={(e) => {
                          const pid = e.target.value;
                          if (!pid) {
                            setLine(i, { phoneId: "" });
                            return;
                          }
                          const p = phoneById[pid];
                          if (!p) return;
                          setLine(i, {
                            phoneId: pid,
                            label: `${p.model} · ${p.condition}`,
                            description: line.description ||
                              `Vendeur : ${p.seller.firstName} ${p.seller.lastName} · ${p.seller.village}`,
                            unitPrice: p.resalePrice,
                            quantity: 1,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-card border hairline-border rounded-md text-[12px] text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                      >
                        <option value="">— Choisir dans l'inventaire (optionnel) —</option>
                        {phones
                          .filter(
                            (p) =>
                              !lines.some(
                                (other, idx) =>
                                  idx !== i && other.phoneId === p.id,
                              ),
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.model} · {p.condition} · {p.seller.village} ·{" "}
                              {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                                maximumFractionDigits: 0,
                              }).format(p.resalePrice)}
                            </option>
                          ))}
                      </select>
                    )}
                    <input
                      type="text"
                      value={line.label}
                      onChange={(e) =>
                        setLine(i, { label: e.target.value, phoneId: line.phoneId })
                      }
                      placeholder="Désignation (ex. iPhone 13 Pro — bon état)"
                      className="w-full px-2.5 py-2 bg-background border hairline-border rounded-md text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) =>
                        setLine(i, { description: e.target.value })
                      }
                      placeholder="Description (optionnelle)"
                      className="w-full px-2.5 py-1.5 bg-transparent border-0 border-b hairline-border text-[12px] text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={line.quantity}
                      onChange={(e) =>
                        setLine(i, {
                          quantity: Math.max(0, Number(e.target.value)),
                        })
                      }
                      placeholder="Qté"
                      className="w-full px-2.5 py-2 bg-background border hairline-border rounded-md text-sm text-foreground text-right tabular focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) =>
                        setLine(i, {
                          unitPrice: Math.max(0, Number(e.target.value)),
                        })
                      }
                      placeholder="PU"
                      className="w-full px-2.5 py-2 bg-background border hairline-border rounded-md text-sm text-foreground text-right tabular focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right pt-2 font-display tabular text-base text-foreground">
                    {eur(line.quantity * line.unitPrice)}
                  </div>
                  <div className="col-span-1 flex justify-end pt-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setLines((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      disabled={lines.length === 1}
                      className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-30"
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="w-3 h-3" strokeWidth={1.8} />
                    </button>
                  </div>
                </article>
              ))}
              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-dashed hairline-border rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all"
              >
                <Plus className="w-3 h-3" strokeWidth={2} />
                Ajouter une ligne
              </button>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 pt-5 border-t hairline-border">
              <div className="space-y-4">
                <div>
                  <Label>Notes (visibles sur le document)</Label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Conditions, remerciements…"
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
                  />
                </div>
                <div>
                  <Label>Conditions de paiement</Label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="ex. À réception, virement IBAN…"
                    className="w-full px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>

              <div className="card-soft rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-display tabular text-foreground">
                    {eur(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm gap-3">
                  <span className="text-muted-foreground">TVA</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) =>
                        setTaxRate(Math.max(0, Number(e.target.value)))
                      }
                      className="w-16 px-2 py-1 bg-background border hairline-border rounded text-sm text-right tabular focus:outline-none focus:border-primary"
                    />
                    <span className="text-muted-foreground text-xs">%</span>
                  </div>
                </div>
                {taxRate > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Montant TVA</span>
                    <span className="font-display tabular text-foreground">
                      {eur(taxAmount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t hairline-border">
                  <span className="font-medium text-foreground">Total TTC</span>
                  <span className="font-display tabular text-2xl text-foreground tracking-tightest">
                    {eur(total)}
                  </span>
                </div>
              </div>
            </div>
          </Section>

          <div className="sticky bottom-0 -mx-6 md:-mx-10 px-6 md:px-10 py-4 bg-background/90 backdrop-blur-md border-t hairline-border flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={upsertMut.isPending}
              className="btn-magnetic inline-flex items-center gap-2 px-6 py-3 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90 disabled:opacity-40 shadow-lg shadow-ink/20"
            >
              {upsertMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" strokeWidth={2} />
              )}
              {isEditing ? "Enregistrer les modifications" : "Créer le document"}
            </button>
          </div>
        </form>
      </PageMotion>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-soft rounded-lg p-6 lg:p-8 space-y-5">
      <header className="flex items-baseline justify-between pb-4 border-b hairline-border">
        <h2 className="font-display text-xl text-foreground tracking-tight">
          {title}
        </h2>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
      />
    </div>
  );
}
