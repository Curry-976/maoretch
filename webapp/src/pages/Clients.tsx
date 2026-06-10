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
import { PageHeader } from "@/components/ui/page-header";
import { StatStrip } from "@/components/ui/stat-strip";
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

  const hasData = clients.length > 0;

  return (
    <Layout>
      <div className="px-6 md:px-10 py-8 md:py-10 space-y-14 max-w-[1400px]">
        <PageHeader
          num="04"
          kicker="CRM"
          title="Vos"
          emphasis="clients"
          subline={
            hasData
              ? `${counts.all} contact${counts.all > 1 ? "s" : ""} — ${counts.verified} démarché${
                  counts.verified > 1 ? "s" : ""
                } et validé${counts.verified > 1 ? "s" : ""}, ${counts.pending} en attente.`
              : "Un client vérifié est quelqu'un que vous avez démarché et qui a validé. Les autres restent en attente jusqu'à confirmation."
          }
          actions={
            <button
              onClick={() => setOpenCreate(true)}
              className="group flex items-center gap-2 px-4 py-2.5 border hairline hover:border-primary text-foreground text-xs font-mono-kicker transition-all duration-500 ease-out-expo"
            >
              <Plus className="w-3 h-3" strokeWidth={1.5} />
              Nouveau client
              <span className="opacity-50 group-hover:translate-x-0.5 transition-transform duration-500 ease-out-expo">
                →
              </span>
            </button>
          }
        />

        {hasData && (
          <>
            <StatStrip
              hero={{
                kicker: "Carnet d'adresses",
                value: String(counts.all),
                sub: "contacts enregistrés",
              }}
              stats={[
                {
                  kicker: "Vérifiés",
                  value: String(counts.verified),
                  sub: "Démarchés & validés",
                  emphasis: "positive",
                },
                {
                  kicker: "En attente",
                  value: String(counts.pending),
                  sub: "À recontacter",
                },
                {
                  kicker: "Taux de validation",
                  value: `${
                    counts.all > 0 ? Math.round((counts.verified / counts.all) * 100) : 0
                  }%`,
                  sub: "Vérifiés / Total",
                },
              ]}
            />
            <div className="h-px bg-hairline" />
          </>
        )}

        {/* Toolbar */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 font-mono-kicker text-[10px] text-muted-foreground">
            <span>05 — Liste & filtres</span>
            <span className="h-px flex-1 bg-hairline max-w-[120px]" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 max-w-md">
              <div className="font-mono-kicker text-[9px] text-muted-foreground mb-2">
                Recherche
              </div>
              <div className="relative">
                <Search
                  strokeWidth={1.2}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, email, téléphone, village…"
                  className="w-full pl-6 pr-4 py-2.5 bg-transparent border-0 border-b hairline focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/40 text-sm transition-colors duration-300 ease-out-expo"
                />
              </div>
            </div>
            <div className="flex gap-0 border hairline">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 font-mono-kicker text-[10px] transition-all duration-300 ease-out-expo ${
                    tab === t.key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label} <span className="opacity-50 ml-1">({counts[t.key]})</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : !hasData ? (
          <EmptyState
            kicker="CRM vide"
            title={
              <>
                Aucun client <span className="italic">encore</span>
              </>
            }
            body={
              <>
                Ajoutez un premier contact — un vendeur démarché, un acheteur revenu deux
                fois, un prospect repéré au marché. Marquez-le « vérifié » dès qu'il a
                validé. Le reste suit naturellement.
              </>
            }
            action={
              <button
                onClick={() => setOpenCreate(true)}
                className="group inline-flex items-center gap-2 px-5 py-3 border hairline hover:border-primary text-foreground text-sm font-medium transition-all duration-500 ease-out-expo"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                Créer un client
                <span className="font-mono-kicker text-[9px] text-muted-foreground group-hover:translate-x-1 transition-transform duration-500 ease-out-expo">
                  →
                </span>
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <div className="border hairline py-16 text-center space-y-3">
            <div className="font-mono-kicker text-[10px] text-muted-foreground">
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

// ---------- Card ----------
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
    <article className="group border hairline p-5 space-y-4 transition-all duration-500 ease-out-expo hover:border-foreground/40">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono-kicker text-[9px] text-muted-foreground mb-1.5">
            {verified ? "Validé" : "À recontacter"}
          </div>
          <h3 className="font-heading text-2xl text-foreground leading-none truncate">
            {client.firstName} <span className="italic">{client.lastName}</span>
          </h3>
          {client.village && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="w-2.5 h-2.5" strokeWidth={1.5} /> {client.village}
            </div>
          )}
        </div>
        {verified ? (
          <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" strokeWidth={1.5} />
        ) : (
          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
        )}
      </header>

      <div className="space-y-1.5 text-[12px]">
        {client.email && (
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="w-3 h-3" strokeWidth={1.5} />
            <span className="truncate">{client.email}</span>
          </a>
        )}
        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <PhoneIcon className="w-3 h-3" strokeWidth={1.5} />
            {client.phone}
          </a>
        )}
        {client.notes && (
          <div className="flex items-start gap-2 pt-1 text-muted-foreground">
            <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <span className="line-clamp-2 italic">{client.notes}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t hairline">
        {verified ? (
          <button
            onClick={() => onToggle("pending")}
            disabled={pending}
            className="flex-1 text-[10px] font-mono-kicker py-2 border hairline hover:border-foreground/40 text-muted-foreground hover:text-foreground transition-all duration-500 ease-out-expo"
          >
            Repasser en attente
          </button>
        ) : (
          <button
            onClick={() => onToggle("verified")}
            disabled={pending}
            className="group/btn flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] font-mono-kicker py-2 bg-foreground text-background hover:bg-foreground/90 transition-all duration-500 ease-out-expo"
          >
            <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
            Marquer vérifié
          </button>
        )}
        <button
          onClick={onDelete}
          className="px-3 py-2 border hairline hover:border-destructive/60 text-muted-foreground hover:text-destructive transition-all duration-500 ease-out-expo"
          aria-label="Supprimer"
        >
          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}

// ---------- Create dialog ----------
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
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border hairline max-w-lg w-full p-8 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <div>
          <div className="font-mono-kicker text-[10px] text-muted-foreground">CRM</div>
          <h2 className="font-heading text-3xl text-foreground italic mt-1">
            Nouveau client<span className="text-primary not-italic">.</span>
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
            <label className="font-mono-kicker text-[9px] text-muted-foreground block mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Suivi commercial, contexte…"
              rows={3}
              className="w-full px-0 py-2 bg-transparent border-0 border-b hairline focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/40 text-sm resize-none transition-colors"
            />
          </div>

          <div>
            <div className="font-mono-kicker text-[9px] text-muted-foreground block mb-2">
              Statut initial
            </div>
            <div className="grid grid-cols-2 gap-0 border hairline">
              <button
                type="button"
                onClick={() => setStatus("pending")}
                className={`py-2.5 px-3 text-[10px] font-mono-kicker transition-all duration-300 ease-out-expo ${
                  status === "pending"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Clock className="w-3 h-3 inline mr-1.5" strokeWidth={1.5} /> En attente
              </button>
              <button
                type="button"
                onClick={() => setStatus("verified")}
                className={`py-2.5 px-3 text-[10px] font-mono-kicker transition-all duration-300 ease-out-expo border-l hairline ${
                  status === "verified"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="w-3 h-3 inline mr-1.5" strokeWidth={1.5} /> Vérifié
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[11px] font-mono-kicker text-muted-foreground hover:text-foreground"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-[11px] font-mono-kicker hover:bg-foreground/90 disabled:opacity-50 transition-all duration-500 ease-out-expo"
            >
              {createMut.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Enregistrer ↵"
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
      <label className="font-mono-kicker text-[9px] text-muted-foreground block mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-0 py-2 bg-transparent border-0 border-b hairline focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/40 text-sm transition-colors"
      />
    </div>
  );
}

// ---------- Delete confirm ----------
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
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-background border hairline max-w-sm w-full p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="font-mono-kicker text-[10px] text-destructive">Suppression</div>
          <h2 className="font-heading text-2xl text-foreground italic mt-1">
            Supprimer ce client<span className="text-primary not-italic">.</span> ?
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground not-italic font-medium">
            {client.firstName} {client.lastName}
          </strong>{" "}
          sera retiré du CRM définitivement. Les téléphones liés ne sont pas concernés.
        </p>
        <div className="flex justify-end gap-3 pt-3 border-t hairline">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[11px] font-mono-kicker text-muted-foreground hover:text-foreground"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground text-[11px] font-mono-kicker hover:bg-destructive/90 disabled:opacity-50 transition-all duration-500 ease-out-expo"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmer ↵"}
          </button>
        </div>
      </div>
    </div>
  );
}
