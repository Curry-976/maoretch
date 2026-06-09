import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
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

type Tab = "all" | "verified" | "pending";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "verified", label: "Vérifiés" },
  { key: "pending", label: "Non vérifiés" },
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
      toast.success(vars.status === "verified" ? "Client vérifié" : "Client repassé en attente");
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
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-4xl text-foreground tracking-wide flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" /> CLIENTS
            </h1>
            <p className="text-muted-foreground mt-1">
              {clients.length} client(s) — {counts.verified} vérifié(s), {counts.pending} en attente
            </p>
          </div>
          <button
            onClick={() => setOpenCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" /> Nouveau client
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, email, téléphone, village)..."
              className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          <div className="flex bg-secondary/50 border border-border rounded-lg p-1 gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${
                  tab === t.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label} ({counts[t.key]})
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-heading text-xl text-foreground">Aucun client</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search || tab !== "all"
                ? "Aucun résultat avec ces filtres."
                : "Commence en ajoutant ton premier client."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-heading text-lg text-foreground tracking-wide truncate">
            {client.firstName} {client.lastName}
          </div>
          {client.village && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" /> {client.village}
            </div>
          )}
        </div>
        {verified ? (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
            <ShieldCheck className="w-3 h-3" /> Vérifié
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> En attente
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        {client.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            <a href={`mailto:${client.email}`} className="hover:text-foreground truncate">
              {client.email}
            </a>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2">
            <PhoneIcon className="w-3.5 h-3.5" />
            <a href={`tel:${client.phone}`} className="hover:text-foreground">
              {client.phone}
            </a>
          </div>
        )}
        {client.notes && (
          <div className="flex items-start gap-2 pt-1">
            <StickyNote className="w-3.5 h-3.5 mt-0.5" />
            <span className="line-clamp-2">{client.notes}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        {verified ? (
          <button
            onClick={() => onToggle("pending")}
            disabled={pending}
            className="flex-1 text-xs font-semibold py-2 px-3 rounded-md border border-border bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all"
          >
            Repasser en attente
          </button>
        ) : (
          <button
            onClick={() => onToggle("verified")}
            disabled={pending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-md bg-green-500/90 hover:bg-green-500 text-white transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Marquer vérifié
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-2 rounded-md border border-border text-destructive hover:bg-destructive/10"
          aria-label="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl text-foreground tracking-wide">NOUVEAU CLIENT</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom *"
              className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom *"
              className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Téléphone"
              className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="Village / ville"
              className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (suivi commercial, contexte, etc.)"
            rows={3}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Statut</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("pending")}
                className={`py-2 px-3 rounded-md text-xs font-semibold border transition-all ${
                  status === "pending"
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                    : "bg-secondary border-border text-muted-foreground"
                }`}
              >
                <Clock className="w-3.5 h-3.5 inline mr-1" /> En attente
              </button>
              <button
                type="button"
                onClick={() => setStatus("verified")}
                className={`py-2 px-3 rounded-md text-xs font-semibold border transition-all ${
                  status === "verified"
                    ? "bg-green-500/15 border-green-500/40 text-green-400"
                    : "bg-secondary border-border text-muted-foreground"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1" /> Vérifié
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card border border-border rounded-xl max-w-sm w-full p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl text-foreground tracking-wide">SUPPRIMER ?</h2>
        <p className="text-sm text-muted-foreground">
          {client.firstName} {client.lastName} sera définitivement supprimé du CRM. Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
