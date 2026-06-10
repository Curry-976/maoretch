import { useState, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Camera,
  ChevronDown,
  Loader2,
  X,
  Check,
  FileSignature,
  User,
  Smartphone as SmartphoneIcon,
  DollarSign,
  Mail,
  Phone as PhoneIcon,
  MapPin,
} from "lucide-react";
import { api } from "@/lib/api";
import { Seller, Phone } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { SignaturePad } from "@/components/SignaturePad";
import { PageMotion } from "@/components/ui/page-motion";
import { MAYOTTE_VILLAGES } from "@/lib/villages";

function Stepper({ steps }: { steps: { num: string; label: string; done: boolean }[] }) {
  return (
    <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 transition-colors ${
              s.done ? "text-foreground" : "text-muted-foreground/50"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-mono tabular transition-all ${
                s.done
                  ? "border-foreground bg-foreground text-background"
                  : "border-hairline"
              }`}
            >
              {s.num}
            </span>
            <span className="text-[12px] uppercase tracking-[0.16em] font-medium">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <span className="w-8 sm:w-16 h-px bg-hairline" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}

const CONDITIONS = [
  { value: "Neuf", label: "Neuf" },
  { value: "Très bon état", label: "Très bon" },
  { value: "Bon état", label: "Bon" },
  { value: "Usagé", label: "Usagé" },
  { value: "À réparer", label: "À réparer" },
];

type SellerMode = "new" | "existing";

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AddPhone() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sellerMode, setSellerMode] = useState<SellerMode>("new");
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [village, setVillage] = useState("");
  const [email, setEmail] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [contractAccepted, setContractAccepted] = useState(false);

  const [model, setModel] = useState("");
  const [condition, setCondition] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [repairPrice, setRepairPrice] = useState("0");
  const [resalePrice, setResalePrice] = useState("");

  const { data: sellers = [] } = useQuery({
    queryKey: ["sellers"],
    queryFn: () => api.get<Seller[]>("/api/sellers"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let sellerId = selectedSellerId;
      if (sellerMode === "new") {
        const seller = await api.post<Seller>("/api/sellers", {
          firstName,
          lastName,
          village,
          email: email.trim() || undefined,
          phone: sellerPhone.trim() || undefined,
          signatureDataUrl: signature || undefined,
        });
        sellerId = seller.id;
      }
      return api.post<Phone>("/api/phones", {
        model,
        condition,
        photoUrl: photoUrl || undefined,
        purchasePrice: parseFloat(purchasePrice),
        repairPrice: parseFloat(repairPrice) || 0,
        resalePrice: parseFloat(resalePrice),
        sellerId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Téléphone ajouté");
      navigate("/phones");
    },
    onError: (err: Error) => toast.error(err.message || "Erreur lors de l'ajout"),
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        }
        if (h > MAX) {
          w = Math.round((w * MAX) / h);
          h = MAX;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        setPhotoUrl(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const margin =
    purchasePrice && resalePrice
      ? parseFloat(resalePrice) - parseFloat(purchasePrice) - (parseFloat(repairPrice) || 0)
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sellerMode === "new") {
      if (!firstName || !lastName || !village) {
        toast.error("Prénom, nom et village sont requis");
        return;
      }
      if (!email.trim() || !sellerPhone.trim()) {
        toast.error("Email et téléphone du vendeur sont requis");
        return;
      }
      if (!contractAccepted) {
        toast.error("Le vendeur doit accepter le contrat");
        return;
      }
      if (!signature) {
        toast.error("La signature du vendeur est requise");
        return;
      }
    }
    if (sellerMode === "existing" && !selectedSellerId) {
      toast.error("Veuillez sélectionner un vendeur");
      return;
    }
    if (!model || !condition || !purchasePrice || !resalePrice) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    createMutation.mutate();
  };

  // Step progression
  const sellerComplete =
    sellerMode === "existing"
      ? !!selectedSellerId
      : firstName && lastName && village && email.trim() && sellerPhone.trim() && contractAccepted && signature;
  const phoneComplete = !!model && !!condition;
  const priceComplete = !!purchasePrice && !!resalePrice;

  return (
    <Layout>
      <PageMotion className="px-6 md:px-10 py-8 md:py-12 space-y-8 max-w-[1100px]">
        {/* Mayotte villages preset for the village field datalist */}
        <datalist id="mayotte-villages">
          {MAYOTTE_VILLAGES.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
        {/* Stepper header — no editorial big title */}
        <header className="space-y-5 pb-6 border-b hairline-border">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Retour
            </button>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
              Nouvel enregistrement
            </div>
          </div>
          <Stepper
            steps={[
              { num: "01", label: "Vendeur", done: !!sellerComplete },
              { num: "02", label: "Appareil", done: phoneComplete },
              { num: "03", label: "Prix", done: priceComplete },
            ]}
          />
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 01 — Vendeur */}
          <Section icon={<User className="w-4 h-4" />} number="01" title="Vendeur" subtitle="Qui cède l'appareil ?">
            <div className="inline-flex p-1 bg-secondary/50 border hairline-border rounded-md">
              {(["new", "existing"] as SellerMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSellerMode(mode)}
                  className={`px-4 py-2 rounded text-[12px] font-medium transition-all duration-300 ease-out-expo ${
                    sellerMode === mode
                      ? "ink-surface shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "new" ? "Nouveau vendeur" : "Vendeur existant"}
                </button>
              ))}
            </div>

            {sellerMode === "existing" ? (
              <div className="max-w-md">
                <Label>Sélectionner un vendeur</Label>
                <div className="relative">
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                  >
                    <option value="">— Choisir un vendeur —</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.village})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    strokeWidth={1.8}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="Prénom *" value={firstName} onChange={setFirstName} placeholder="Said" />
                  <Input label="Nom *" value={lastName} onChange={setLastName} placeholder="Bacar" />
                  <Input
                    label="Village *"
                    value={village}
                    onChange={setVillage}
                    placeholder="Mamoudzou"
                    icon={<MapPin className="w-3 h-3" />}
                    list="mayotte-villages"
                  />
                  <Input
                    label="Email *"
                    value={email}
                    onChange={setEmail}
                    type="email"
                    placeholder="said.bacar@example.com"
                    icon={<Mail className="w-3 h-3" />}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Téléphone *"
                      value={sellerPhone}
                      onChange={setSellerPhone}
                      type="tel"
                      placeholder="+262 639 XX XX XX"
                      icon={<PhoneIcon className="w-3 h-3" />}
                    />
                  </div>
                </div>

                {/* Contract */}
                <div className="pt-8 mt-8 border-t hairline-border space-y-5">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-foreground" strokeWidth={1.8} />
                    <h3 className="font-display text-lg text-foreground tracking-tight">
                      Contrat de cession
                    </h3>
                  </div>

                  <article className="paper-tile rounded-md p-8 max-w-3xl">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-paper-foreground/50 font-medium mb-4">
                      Acte de cession · Maore-Tech
                    </div>
                    <div className="space-y-3 text-[14px] text-paper-foreground leading-relaxed">
                      <p>
                        Le vendeur soussigné,{" "}
                        <strong className="font-semibold">
                          {firstName || "[Prénom]"} {lastName || "[Nom]"}
                        </strong>
                        , domicilié à{" "}
                        <strong className="font-semibold">{village || "[Village]"}</strong>,
                        joignable au{" "}
                        <strong className="font-semibold">{sellerPhone || "[téléphone]"}</strong>
                        {email && (
                          <>
                            {" "}
                            et à l'adresse{" "}
                            <strong className="font-semibold">{email}</strong>
                          </>
                        )}
                        , déclare céder à <em className="font-italic">Maore-Tech</em> le téléphone décrit ci-après,
                        en pleine propriété, libre de tout gage.
                      </p>
                      <p>
                        Il certifie en être le propriétaire légitime et garantit l'acquéreur
                        contre tout recours d'un tiers. Le prix convenu, ci-dessous, vaut
                        transfert immédiat de propriété au règlement.
                      </p>
                    </div>
                  </article>

                  <label className="flex items-start gap-3 text-sm text-foreground cursor-pointer select-none max-w-3xl">
                    <input
                      type="checkbox"
                      checked={contractAccepted}
                      onChange={(e) => setContractAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-primary"
                    />
                    <span className="leading-relaxed">
                      Le vendeur a lu et accepte les termes du contrat ci-dessus.
                    </span>
                  </label>

                  <div className="max-w-3xl">
                    <Label>Signature du vendeur *</Label>
                    <SignaturePad value={signature} onChange={setSignature} />
                  </div>
                </div>
              </>
            )}
          </Section>

          {/* Section 02 — Appareil */}
          <Section icon={<SmartphoneIcon className="w-4 h-4" />} number="02" title="Appareil" subtitle="Le téléphone, en détail.">
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
              <div className="space-y-5">
                <Input
                  label="Modèle *"
                  value={model}
                  onChange={setModel}
                  placeholder="iPhone 13 Pro, Samsung Galaxy S22…"
                />

                <div>
                  <Label>État *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCondition(c.value)}
                        className={`py-2.5 px-2 rounded-md text-[12px] font-medium border transition-all duration-300 ease-out-expo ${
                          condition === c.value
                            ? "bg-foreground text-background border-foreground"
                            : "bg-card border-hairline text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Photo (optionnelle)</Label>
                {photoUrl ? (
                  <div className="relative aspect-square max-w-[260px]">
                    <img
                      src={photoUrl}
                      alt="Téléphone"
                      className="w-full h-full object-cover rounded-md border hairline-border"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      className="absolute top-2 right-2 w-7 h-7 bg-background border hairline-border rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all"
                      aria-label="Supprimer la photo"
                    >
                      <X className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group aspect-square max-w-[260px] w-full border border-dashed border-hairline rounded-md flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-foreground/40 hover:bg-foreground/5 transition-all duration-500 ease-out-expo bg-card"
                  >
                    <Camera className="w-6 h-6 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                    <span className="text-[11px] uppercase tracking-wider">
                      Ajouter une photo
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhoto}
                  className="hidden"
                />
              </div>
            </div>
          </Section>

          {/* Section 03 — Prix */}
          <Section icon={<DollarSign className="w-4 h-4" />} number="03" title="Économie" subtitle="Le prix de l'opération.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl">
              <Input
                label="Prix d'achat (€) *"
                value={purchasePrice}
                onChange={setPurchasePrice}
                type="number"
                placeholder="0"
              />
              <Input
                label="Réparation (€)"
                value={repairPrice}
                onChange={setRepairPrice}
                type="number"
                placeholder="0"
              />
              <Input
                label="Revente (€) *"
                value={resalePrice}
                onChange={setResalePrice}
                type="number"
                placeholder="0"
              />
            </div>

            {margin !== null && (
              <div
                className={`mt-6 card-soft rounded-md p-6 max-w-3xl flex items-center justify-between gap-4 ${
                  margin >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                }`}
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                    Marge estimée
                  </div>
                  <div
                    className={`font-display tabular text-4xl mt-1 ${
                      margin >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {margin >= 0 ? "+" : ""}
                    {eur(margin)}
                  </div>
                </div>
                {margin < 0 && (
                  <span className="text-xs text-destructive/80 max-w-[200px] text-right">
                    Le prix de revente est sous le coût total.
                  </span>
                )}
              </div>
            )}
          </Section>

          {/* Submit bar */}
          <div className="sticky bottom-0 -mx-6 md:-mx-10 px-6 md:px-10 py-5 bg-background/90 backdrop-blur-md border-t hairline-border flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-magnetic inline-flex items-center gap-2 px-6 py-3 ink-surface rounded-md text-[13px] font-medium hover:bg-ink/90 disabled:opacity-40 shadow-lg shadow-ink/20"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={2} />
                  Enregistrer le téléphone
                </>
              )}
            </button>
          </div>
        </form>
      </PageMotion>
    </Layout>
  );
}

function Section({
  icon,
  number,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  number: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="card-soft rounded-lg p-6 lg:p-8 space-y-6">
      <header className="flex items-center gap-4 pb-6 border-b hairline-border">
        <div className="w-9 h-9 rounded-md bg-foreground/8 text-foreground flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-medium tabular">
              {number}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              {title}
            </span>
          </div>
          <h2 className="font-display text-2xl text-foreground tracking-tight">
            {subtitle}
          </h2>
        </div>
      </header>
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
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
  icon,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: ReactNode;
  list?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          list={list}
          min={type === "number" ? 0 : undefined}
          className={`w-full ${
            icon ? "pl-9" : "pl-3.5"
          } pr-3.5 py-2.5 bg-background border hairline-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-300`}
        />
      </div>
    </div>
  );
}
