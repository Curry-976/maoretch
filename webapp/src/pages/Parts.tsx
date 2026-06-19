import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  X,
  ChevronRight,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { api } from "@/lib/api";
import { Part } from "@/lib/types";
import { COMPANY } from "@/lib/company";
import { Layout } from "@/components/Layout";
import { PageMotion } from "@/components/ui/page-motion";
import { CountUp } from "@/components/ui/count-up";
import { SkeletonRows } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const PART_TYPES = [
  "Écran",
  "Batterie",
  "Vitre arrière",
  "Connecteur de charge",
  "Caméra arrière",
  "Caméra avant / Face ID",
  "Haut-parleur",
  "Écouteur interne",
  "Micro",
  "Châssis",
  "Boutons (volume / power)",
  "Nappe",
  "Lecteur SIM",
  "Autre",
];

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Oppo", "Huawei", "Google", "OnePlus", "Realme", "Honor", "Tecno"];
const QUALITIES = ["Original", "GX", "Compatible", "OLED", "Incell"];

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

// Excel sheet names can't exceed 31 chars or contain : \ / ? * [ ]
function sheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, "-").slice(0, 31);
}

function exportToExcel(parts: Part[]) {
  const wb = XLSX.utils.book_new();

  // ---- Summary sheet: everything, sortable/filterable ----
  const sorted = [...parts].sort(
    (a, b) =>
      a.type.localeCompare(b.type) ||
      a.deviceBrand.localeCompare(b.deviceBrand) ||
      a.deviceModel.localeCompare(b.deviceModel),
  );
  const summaryRows = [
    [`${COMPANY.name} — Grille tarifaire`],
    [`Exporté le ${new Date().toLocaleDateString("fr-FR")}`],
    [],
    ["Catégorie", "Marque", "Modèle", "Qualité", "Prix (€)", "Notes"],
    ...sorted.map((p) => [
      p.type,
      p.deviceBrand,
      p.deviceModel,
      p.quality ?? "",
      p.price,
      p.notes ?? "",
    ]),
  ];
  const summary = XLSX.utils.aoa_to_sheet(summaryRows);
  summary["!cols"] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, summary, "Toute la grille");

  // ---- One sheet per category ----
  const byCategory = new Map<string, Part[]>();
  for (const p of sorted) {
    if (!byCategory.has(p.type)) byCategory.set(p.type, []);
    byCategory.get(p.type)!.push(p);
  }
  for (const [category, items] of byCategory) {
    const rows = [
      [category.toUpperCase()],
      [],
      ["Marque", "Modèle", "Qualité", "Prix (€)", "Notes"],
      ...items.map((p) => [
        p.deviceBrand,
        p.deviceModel,
        p.quality ?? "",
        p.price,
        p.notes ?? "",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, sheetName(category));
  }

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `grille-tarifaire-maore-tech-${today}.xlsx`);
}

export default function Parts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Part | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Part | null>(null);

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["parts"],
    queryFn: () => api.get<Part[]>("/api/parts"),
  });

  const filtered = useMemo(() => {
    if (!search) return parts;
    const s = search.toLowerCase();
    return parts.filter(
      (p) =>
        p.deviceBrand.toLowerCase().includes(s) ||
        p.deviceModel.toLowerCase().includes(s) ||
        p.type.toLowerCase().includes(s) ||
        (p.quality?.toLowerCase().includes(s) ?? false),
    );
  }, [parts, search]);

  // brand -> parts[]
  const grouped = useMemo(() => {
    const map = new Map<string, Part[]>();
    for (const p of filtered) {
      if (!map.has(p.deviceBrand)) map.set(p.deviceBrand, []);
      map.get(p.deviceBrand)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/parts/${id}`),
    onSuccess: () => {
      toast.success("Composant supprimé");
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      setConfirmDelete(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Layout>
      <PageMotion className="px-6 md:px-10 py-8 md:py-12 space-y-8 max-w-[1400px]">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 border-b hairline-border">
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              Réparation
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-[clamp(2rem,3.4vw,2.8rem)] leading-none text-foreground tracking-tightest">
                Grille tarifaire
              </h1>
              <span className="font-display tabular text-2xl text-muted-foreground">
                {parts.length ? <CountUp value={parts.length} /> : "—"}
              </span>
            </div>
            <p className="text-[14px] text-muted-foreground max-w-xl">
              Le prix de vente de chaque composant à remplacer, par marque et
              modèle compatible. Pour les écrans, précisez la qualité (Original,
              GX…).
            </p>
          </div>
          <div className="flex gap-2 self-start">
            {parts.length > 0 && (
              <button
                onClick={() => exportToExcel(parts)}
                className="inline-flex items-center gap-2 px-4 py-2.5 border hairline-border rounded-md text-[13px] font-medium text-foreground hover:border-foreground/40 transition-all"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={2} />
                Exporter Excel
              </button>
            )}
            <button
              onClick={() => setCreating(true)}
              className="btn-magnetic inline-flex items-center gap-2 px-4 py-2.5 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Ajouter un composant
            </button>
          </div>
        </header>

        {/* Search */}
        {parts.length > 0 && (
          <div className="relative max-w-md">
            <Search
              strokeWidth={1.8}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Marque, modèle, composant, qualité…"
              className="w-full pl-10 pr-4 py-3 bg-card border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <SkeletonRows count={5} rowHeight="h-14" />
        ) : parts.length === 0 ? (
          <EmptyState
            eyebrow="Grille vide"
            title="Vos tarifs de composants"
            italic="apparaîtront ici"
            body={
              <>
                Ajoutez le prix de vente de chaque pièce que vous remplacez —
                écran iPhone 13 (Original / GX), batterie Galaxy A52, connecteur
                de charge… La grille devient votre référence pour chiffrer une
                réparation en quelques secondes.
              </>
            }
            action={
              <button
                onClick={() => setCreating(true)}
                className="btn-magnetic inline-flex items-center gap-2 px-5 py-3 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Ajouter un composant
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <div className="card-soft rounded-lg py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun composant ne correspond à « {search} ».
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([brand, items]) => (
              <BrandTable
                key={brand}
                brand={brand}
                items={items}
                onEdit={(p) => setEditing(p)}
                onDelete={(p) => setConfirmDelete(p)}
              />
            ))}
          </div>
        )}
      </PageMotion>

      {(creating || editing) && (
        <PartDialog
          part={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmDelete
          part={confirmDelete}
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteMut.mutate(confirmDelete.id)}
        />
      )}
    </Layout>
  );
}

function BrandTable({
  brand,
  items,
  onEdit,
  onDelete,
}: {
  brand: string;
  items: Part[];
  onEdit: (p: Part) => void;
  onDelete: (p: Part) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="card-soft rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 border-b hairline-border flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
              open ? "rotate-90" : ""
            }`}
            strokeWidth={1.8}
          />
          <h3 className="font-display text-xl text-foreground tracking-tight">
            {brand}
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {items.length} tarif{items.length > 1 ? "s" : ""}
          </span>
        </div>
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground border-b hairline-border">
                <th className="text-left font-medium px-5 py-2.5">Modèle</th>
                <th className="text-left font-medium px-3 py-2.5">Composant</th>
                <th className="text-left font-medium px-3 py-2.5">Qualité</th>
                <th className="text-right font-medium px-3 py-2.5">Prix</th>
                <th className="px-5 py-2.5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y hairline-border">
              {items.map((p) => (
                <tr key={p.id} className="group hover:bg-secondary/20">
                  <td className="px-5 py-3 text-foreground font-medium">
                    {p.deviceModel}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{p.type}</td>
                  <td className="px-3 py-3">
                    {p.quality ? (
                      <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-foreground/8 text-foreground">
                        {p.quality}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-display tabular text-base text-foreground">
                    {eur(p.price)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(p)}
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                        aria-label="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="p-1.5 text-muted-foreground hover:text-destructive"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PartDialog({ part, onClose }: { part: Part | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEdit = !!part;
  const [deviceBrand, setDeviceBrand] = useState(part?.deviceBrand ?? "");
  const [deviceModel, setDeviceModel] = useState(part?.deviceModel ?? "");
  const [type, setType] = useState(part?.type ?? "Écran");
  const [quality, setQuality] = useState(part?.quality ?? "");
  const [price, setPrice] = useState(part ? String(part.price) : "");
  const [notes, setNotes] = useState(part?.notes ?? "");

  const isScreen = type.toLowerCase().includes("écran");

  const mut = useMutation({
    mutationFn: () => {
      const payload = {
        deviceBrand: deviceBrand.trim(),
        deviceModel: deviceModel.trim(),
        type,
        quality: quality.trim() || undefined,
        price: parseFloat(price) || 0,
        notes: notes.trim() || undefined,
      };
      return isEdit
        ? api.patch<Part>(`/api/parts/${part!.id}`, payload)
        : api.post<Part>("/api/parts", payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Composant mis à jour" : "Composant ajouté");
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceBrand.trim() || !deviceModel.trim() || !type) {
      toast.error("Marque, modèle et composant sont requis");
      return;
    }
    mut.mutate();
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
            Grille tarifaire
          </div>
          <h2 className="font-display text-2xl text-foreground tracking-tight mt-1">
            {isEdit ? "Modifier le composant" : "Nouveau composant"}
          </h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <datalist id="part-brands">
            {BRANDS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          <datalist id="part-qualities">
            {QUALITIES.map((q) => (
              <option key={q} value={q} />
            ))}
          </datalist>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Marque compatible *">
              <input
                value={deviceBrand}
                onChange={(e) => setDeviceBrand(e.target.value)}
                list="part-brands"
                placeholder="Apple"
                className={inputCls}
              />
            </Field>
            <Field label="Modèle compatible *">
              <input
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                placeholder="iPhone 13"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Composant *">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputCls}
            >
              {PART_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={isScreen ? "Qualité (Original / GX…)" : "Qualité (optionnelle)"}>
              <input
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                list="part-qualities"
                placeholder={isScreen ? "Original ou GX" : "—"}
                className={inputCls}
              />
            </Field>
            <Field label="Prix de vente (€) *">
              <input
                type="number"
                min={0}
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className={`${inputCls} text-right tabular`}
              />
            </Field>
          </div>

          <Field label="Notes (optionnelles)">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex. pose comprise, garantie 3 mois…"
              className={inputCls}
            />
          </Field>

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
              disabled={mut.isPending}
              className="btn-magnetic inline-flex items-center gap-2 px-5 py-2.5 ink-surface rounded-md text-[12px] font-medium hover:bg-ink/90 disabled:opacity-50"
            >
              {mut.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isEdit ? (
                "Enregistrer"
              ) : (
                "Ajouter"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

function ConfirmDelete({
  part,
  onCancel,
  onConfirm,
  loading,
}: {
  part: Part;
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
            Supprimer ce tarif
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-medium">
            {part.type} {part.deviceBrand} {part.deviceModel}
            {part.quality ? ` (${part.quality})` : ""}
          </strong>{" "}
          sera retiré de la grille. Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3 pt-3 border-t hairline-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[12px] text-muted-foreground hover:text-foreground"
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
