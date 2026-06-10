import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ShieldCheck,
  Loader2,
  X,
  Eye,
  EyeOff,
  KeyRound,
  Ban,
  UserCog,
} from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { Layout } from "@/components/Layout";
import { PageMotion } from "@/components/ui/page-motion";
import { CountUp } from "@/components/ui/count-up";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigate } from "react-router-dom";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  banned?: boolean | null;
  createdAt: string;
};

export default function Users() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [openCreate, setOpenCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const isAdmin = session?.user?.role === "admin";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: { limit: 100, offset: 0 },
      });
      if (result.error) throw new Error(result.error.message || "Erreur");
      return (result.data?.users ?? []) as User[];
    },
    enabled: isAdmin,
  });

  const deleteMut = useMutation({
    mutationFn: async (userId: string) => {
      const r = await authClient.admin.removeUser({ userId });
      if (r.error) throw new Error(r.error.message || "Erreur");
    },
    onSuccess: () => {
      toast.success("Utilisateur supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmDelete(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const promoteMut = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      const r = await authClient.admin.setRole({ userId, role });
      if (r.error) throw new Error(r.error.message || "Erreur");
    },
    onSuccess: () => {
      toast.success("Rôle mis à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Non-admins are redirected away
  if (session && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const adminCount = users.filter((u) => u.role === "admin").length;
  const standardCount = users.filter((u) => u.role !== "admin").length;

  return (
    <Layout>
      <PageMotion className="px-6 md:px-10 py-8 md:py-12 space-y-10 max-w-[1100px]">
        {/* Header — data-as-title */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b hairline-border">
          <div className="space-y-3 max-w-3xl">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              Administration
            </div>
            <h1 className="font-display text-[clamp(2.2rem,3.6vw,3rem)] leading-[1.05] text-foreground tracking-tightest text-balance">
              <span className="tabular">
                {users.length ? <CountUp value={users.length} /> : "—"}
              </span>{" "}
              <span className="text-muted-foreground/70 font-normal">
                utilisateur{users.length > 1 ? "s" : ""} —
              </span>{" "}
              <span className="tabular">
                {adminCount ? <CountUp value={adminCount} /> : "—"}
              </span>{" "}
              <span className="text-muted-foreground/70 font-normal">
                admin{adminCount > 1 ? "s" : ""},
              </span>{" "}
              <span className="font-italic font-normal">
                {standardCount ? <CountUp value={standardCount} /> : "—"} membres.
              </span>
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed max-w-xl">
              Vous seul pouvez créer, promouvoir ou supprimer des comptes. Les
              utilisateurs se connectent avec leur email et un mot de passe que vous
              définissez.
            </p>
          </div>
          <button
            onClick={() => setOpenCreate(true)}
            className="btn-magnetic inline-flex items-center gap-2 px-4 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90 self-start"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Nouvel utilisateur
          </button>
        </header>

        {/* User list */}
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[82px]" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="card-soft rounded-lg py-16 text-center">
            <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isMe={u.id === session?.user?.id}
                onPromote={(role) => promoteMut.mutate({ userId: u.id, role })}
                onDelete={() => setConfirmDelete(u)}
              />
            ))}
          </div>
        )}
      </PageMotion>

      {openCreate && <CreateUserDialog onClose={() => setOpenCreate(false)} />}
      {confirmDelete && (
        <ConfirmDeleteDialog
          user={confirmDelete}
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteMut.mutate(confirmDelete.id)}
        />
      )}
    </Layout>
  );
}

function UserRow({
  user,
  isMe,
  onPromote,
  onDelete,
}: {
  user: User;
  isMe: boolean;
  onPromote: (role: "admin" | "user") => void;
  onDelete: () => void;
}) {
  const isAdmin = user.role === "admin";
  return (
    <article className="card-soft rounded-lg p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-full bg-foreground/8 border hairline-border flex items-center justify-center font-display text-sm font-semibold text-foreground flex-shrink-0">
        {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg text-foreground tracking-tight truncate">
            {user.name || user.email}
          </h3>
          {isAdmin && (
            <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-foreground/10 text-foreground inline-flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5" strokeWidth={2} />
              Admin
            </span>
          )}
          {user.banned && (
            <span className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-destructive/10 text-destructive inline-flex items-center gap-1">
              <Ban className="w-2.5 h-2.5" strokeWidth={2} />
              Bloqué
            </span>
          )}
          {isMe && (
            <span className="text-[10px] text-muted-foreground italic">vous</span>
          )}
        </div>
        <div className="text-[12px] text-muted-foreground mt-0.5 truncate">
          {user.email}
        </div>
      </div>
      {!isMe && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPromote(isAdmin ? "user" : "admin")}
            className="px-3 py-1.5 text-[11px] font-medium border hairline-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all"
          >
            {isAdmin ? "Rétrograder" : "Promouvoir admin"}
          </button>
          <button
            onClick={onDelete}
            className="p-2 border hairline-border rounded-md text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all"
            aria-label="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
        </div>
      )}
    </article>
  );
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [showPassword, setShowPassword] = useState(false);

  const createMut = useMutation({
    mutationFn: async () => {
      const r = await authClient.admin.createUser({
        email: email.trim(),
        password,
        name: name.trim(),
        role,
      });
      if (r.error) throw new Error(r.error.message || "Erreur");
      return r.data;
    },
    onSuccess: () => {
      toast.success("Utilisateur créé");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!?@#";
    let p = "";
    for (let i = 0; i < 12; i++) {
      p += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(p);
    setShowPassword(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) {
      toast.error("Tous les champs sont requis (mot de passe ≥ 8 caractères)");
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
            Administration
          </div>
          <h2 className="font-display text-3xl text-foreground tracking-tight mt-1">
            Nouvel utilisateur
          </h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Nom complet</Label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Said Bacar"
              className="w-full px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div>
            <Label>Email</Label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="said.bacar@maore-tech.yt"
              className="w-full px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Mot de passe (≥ 8 caractères)</Label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <KeyRound className="w-2.5 h-2.5" strokeWidth={2} />
                Générer
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                className="w-full pr-11 px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" strokeWidth={1.8} />
                ) : (
                  <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
                )}
              </button>
            </div>
            {password && password.length < 8 && (
              <p className="text-[11px] text-destructive mt-1">
                Le mot de passe doit faire au moins 8 caractères.
              </p>
            )}
          </div>

          <div>
            <Label>Rôle</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`py-2.5 px-3 rounded-md text-[12px] font-medium border transition-all ${
                  role === "user"
                    ? "bg-foreground/8 border-foreground/30 text-foreground"
                    : "border-hairline text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCog className="w-3 h-3 inline mr-1.5" strokeWidth={1.8} /> Membre
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`py-2.5 px-3 rounded-md text-[12px] font-medium border transition-all ${
                  role === "admin"
                    ? "bg-foreground/8 border-foreground/30 text-foreground"
                    : "border-hairline text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="w-3 h-3 inline mr-1.5" strokeWidth={1.8} /> Admin
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
                "Créer l'utilisateur"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({
  user,
  onCancel,
  onConfirm,
  loading,
}: {
  user: User;
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
            Supprimer ce compte
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-medium">
            {user.name || user.email}
          </strong>{" "}
          ne pourra plus se connecter et toutes ses sessions seront révoquées. Les
          données qu'il a saisies (téléphones, clients) restent intactes.
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">
      {children}
    </div>
  );
}
