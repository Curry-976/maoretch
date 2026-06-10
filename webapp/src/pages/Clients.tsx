import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  ShieldCheck,
  Loader2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  StickyNote,
} from "lucide-react";
import { api } from "@/lib/api";
import { Client, ClientStatus } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/ui/empty-state";

type Tab = "all" | "verified" | "pending";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "verified", label: "Vérifiés" },
  { key: "pending", label: "En attente" },
];

export default function Clients() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get<Client[]>("/api/clients"),
  });

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (tab !== "all" && c.status !== tab) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        c.firstName.toLowerCase().includes(s) ||
        c.lastName.toLowerCase().includes(s) ||
        (c.email?.toLowerCase().includes(s) ?? false) ||
        (c.phone?.toLowerCase().includes(s) ?? false) ||
        (c.village?.toLowerCase().includes(s) ?? false)
      );
    });
  }, [clients, tab, search]);

  const counts = useMemo(
    () => ({
      all: clients.length,
      verified: clients.filter((c) => c.status === "verified").length,
      pending: clients.filter((c) => c.status === "pending").length,
    }),
    [clients],
  );

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClientStatus }) =>
      api.patch<Client>(`/api/clients/${id}`, { status }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === "verified" ? "Client vérifié" : "Repassé en attente");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/clients/${id}`),
    onSuccess: () => {
      toast.success("Client supprimé");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setConfirmDelete(null);
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  return (
    <Layout>
      <div className="px-6 md:px-10 py-8 md:py-12 space-y-8 max-w-[1400px]">
        {/* Tabs-as-title: the segmented control IS the H1 */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 border-b hairline-border">
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              Carnet de clients
            </div>
            <nav className="flex items-baseline gap-x-8 gap-y-2 flex-wrap" role="tablist">
              {TABS.map((t) => {
                const active = tab === t.key;
                const count = counts[t.key];
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    role="tab"
                    aria-selected={active}
                    className={`group relative pb-2 transition-colors ${
                      active ? "text-foreground" : "text-foreground/35 hover:text-foreground/70"
                    }`}
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="font-display tabular text-[clamp(1.8rem,3vw,2.6rem)] leading-none tracking-tightest">
                        {count || "—"}
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
          <button
            onClick={() => setOpenCreate(true)}
            className="btn-magnetic inline-flex items-center gap-2 px-4 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90 self-start"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouveau client
          </button>
        </header>

        {/* Toolbar — search only (tabs are now in the header) */}
        {counts.all > 0 && (
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                strokeWidth={1.8}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, email, téléphone, village…"
                className="w-full pl-10 pr-4 py-3 bg-card border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
              />
            </div>
            <div className="hidden">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="hidden"
                >
                  {t.label}
                  <span className="ml-1 opacity-50 tabular">({counts[t.key]})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : counts.all === 0 ? (
          <EmptyState
            eyebrow="CRM vide"
            title="Aucun client"
            italic="encore"
            body={
              <>
                Ajoutez un premier contact — un vendeur démarché, un acheteur revenu deux
                fois, un prospect repéré au marché. Marquez-le « vérifié » dès qu'il a
                validé.
              </>
            }
            action={
              <button
                onClick={() => setOpenCreate(true)}
                className="btn-magnetic inline-flex items-center gap-2 px-5 py-3 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Créer un client
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <div className="card-soft rounded-lg py-16 text-center">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Aucun résultat
            </div>
            <p className="text-sm text-muted-foreground">
              {search ? `Aucun client ne correspond à « ${search} ».` : "Aucun client avec ce filtre."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onToggle={(status) => toggleStatus.mutate({ id: client.id, status })}
                onDelete={() => setConfirmDelete(client)}
                pending={toggleStatus.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {openCreate && <CreateClientDialog onClose={() => setOpenCreate(false)} />}
      {confirmDelete && (
        <ConfirmDeleteDialog
          client={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteMut.mutate(confirmDelete.id)}
          loading={deleteMut.isPending}
        />
      )}
    </Layout>
  );
}

function ClientCard({
  client,
  onToggle,
  onDelete,
  pending,
}: {
  client: Client;
  onToggle: (status: ClientStatus) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const verified = client.status === "verified";
  return (
    <article className="card-soft rounded-lg p-5 space-y-4 hover:-translate-y-0.5 transition-all duration-500 ease-out-expo">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-foreground/8 to-secondary flex items-center justify-center font-display text-sm font-semibold text-foreground flex-shrink-0">
            {client.firstName[0]}
            {client.lastName[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg text-foreground tracking-tight truncate">
              {client.firstName} {client.lastName}
            </h3>
            {client.village && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <MapPin className="w-2.5 h-2.5" strokeWidth={1.5} /> {client.village}
              </div>
            )}
          </div>
        </div>
        {verified ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-[9px] uppercase tracking-wider font-medium">
            <ShieldCheck className="w-2.5 h-2.5" strokeWidth={2} />
            Vérifié
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded text-[9px] uppercase tracking-wider font-medium">
            <Clock className="w-2.5 h-2.5" strokeWidth={2} />
            En attente
          </div>
        )}
      </header>

      <div className="space-y-1.5 text-[12px] text-muted-foreground">
        {client.email && (
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 hover:text-foreground transition-colors truncate"
          >
            <Mail className="w-3 h-3" strokeWidth={1.5} />
            <span className="truncate">{client.email}</span>
          </a>
        )}
        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <PhoneIcon className="w-3 h-3" strokeWidth={1.5} />
            {client.phone}
          </a>
        )}
        {client.notes && (
          <div className="flex items-start gap-2 pt-1">
            <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <span className="line-clamp-2 italic">{client.notes}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t hairline-border">
        {verified ? (
          <button
            onClick={() => onToggle("pending")}
            disabled={pending}
            className="flex-1 text-[11px] font-medium py-2 border hairline-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all duration-300"
          >
            Repasser en attente
          </button>
        ) : (
          <button
            onClick={() => onToggle("verified")}
            disabled={pending}
            className="btn-magnetic flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-medium py-2 ink-surface rounded-md hover:bg-ink/90"
          >
            <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
            Marquer vérifié
          </button>
        )}
        <button
          onClick={onDelete}
          className="px-3 py-2 border hairline-border rounded-md text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all duration-300"
          aria-label="Supprimer"
        >
          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}

function CreateClientDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ClientStatus>("pending");

  const createMut = useMutation({
    mutationFn: () =>
      api.post<Client>("/api/clients", {
        firstName,
        lastName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        village: village.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      }),
    onSuccess: () => {
      toast.success("Client ajouté");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || "Erreur"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Prénom et nom requis");
      return;
    }
    createMut.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card-elevated bg-card rounded-lg max-w-lg w-full p-7 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" strokeWidth={1.8} />
        </button>

        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            CRM
          </div>
          <h2 className="font-display text-3xl text-foreground tracking-tight mt-1">
            Nouveau client
          </h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom *" value={firstName} onChange={setFirstName} />
            <Field label="Nom *" value={lastName} onChange={setLastName} />
          </div>
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Téléphone" value={phone} onChange={setPhone} type="tel" />
            <Field label="Village / ville" value={village} onChange={setVillage} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium block mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Suivi commercial, contexte…"
              rows={3}
              className="w-full px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm resize-none placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium block mb-2">
              Statut initial
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("pending")}
                className={`py-2.5 px-3 rounded-md text-[12px] font-medium border transition-all duration-300 ${
                  status === "pending"
                    ? "bg-warning/10 border-warning/40 text-warning"
                    : "border-hairline text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="w-3 h-3 inline mr-1.5" strokeWidth={2} /> En attente
              </button>
              <button
                type="button"
                onClick={() => setStatus("verified")}
                className={`py-2.5 px-3 rounded-md text-[12px] font-medium border transition-all duration-300 ${
                  status === "verified"
                    ? "bg-success/10 border-success/40 text-success"
                    : "border-hairline text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="w-3 h-3 inline mr-1.5" strokeWidth={2} /> Vérifié
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t hairline-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="btn-magnetic inline-flex items-center gap-2 px-5 py-2.5 ink-surface rounded-md text-[12px] font-medium hover:bg-ink/90 disabled:opacity-50"
            >
              {createMut.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium block mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
      />
    </div>
  );
}

function ConfirmDeleteDialog({
  client,
  onCancel,
  onConfirm,
  loading,
}: {
  client: Client;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
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
            Supprimer ce client
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-medium">
            {client.firstName} {client.lastName}
          </strong>{" "}
          sera retiré du CRM définitivement. Les téléphones liés ne sont pas concernés.
        </p>
        <div className="flex justify-end gap-3 pt-3 border-t hairline-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-magnetic inline-flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-md text-[12px] font-medium hover:bg-destructive/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
