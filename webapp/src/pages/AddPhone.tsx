import { useState, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, ChevronDown, Loader2, X, Check, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Seller, Phone } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { SignaturePad } from "@/components/SignaturePad";
import { PageHeader } from "@/components/ui/page-header";

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

  return (
    <Layout>
      <div className="px-6 md:px-10 py-8 md:py-10 space-y-14 max-w-[1100px]">
        <PageHeader
          num="02"
          kicker="Nouvel appareil"
          title="Enregistrer un"
          emphasis="téléphone"
          subline={
            <>
              Démarchage, état, prix, marge — tout tient dans une seule passe. Si le
              vendeur est nouveau, vous recueillez aussi sa signature de cession.
            </>
          }
        />

        <form onSubmit={handleSubmit} className="space-y-16">
          {/* Section 01 — Vendeur */}
          <Section num="01" kicker="Vendeur" title="Qui cède l'appareil ?">
            <div className="flex gap-0 border hairline w-fit">
              {(["new", "existing"] as SellerMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSellerMode(mode)}
                  className={`px-5 py-2.5 text-[11px] font-mono-kicker transition-all duration-300 ease-out-expo ${
                    sellerMode === mode
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  } ${mode === "existing" ? "border-l hairline" : ""}`}
                >
                  {mode === "new" ? "Nouveau vendeur" : "Vendeur existant"}
                </button>
              ))}
            </div>

            {sellerMode === "existing" ? (
              <div className="max-w-md">
                <FieldLabel>Sélectionner un vendeur</FieldLabel>
                <div className="relative">
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(e.target.value)}
                    required
                    className="w-full px-0 py-3 bg-transparent border-0 border-b hairline focus:outline-none focus:border-primary text-foreground appearance-none text-sm transition-colors"
                  >
                    <option value="" className="bg-background">— Choisir un vendeur —</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id} className="bg-background">
                        {s.firstName} {s.lastName} ({s.village})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    strokeWidth={1.2}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                  <UnderlinedField
                    label="Prénom *"
                    value={firstName}
                    onChange={setFirstName}
                    placeholder="Mamadou"
                  />
                  <UnderlinedField
                    label="Nom *"
                    value={lastName}
                    onChange={setLastName}
                    placeholder="Diallo"
                  />
                  <UnderlinedField
                    label="Village *"
                    value={village}
                    onChange={setVillage}
                    placeholder="Conakry"
                  />
                  <UnderlinedField
                    label="Email *"
                    value={email}
                    onChange={setEmail}
                    type="email"
                    placeholder="vendeur@exemple.com"
                  />
                  <UnderlinedField
                    label="Téléphone *"
                    value={sellerPhone}
                    onChange={setSellerPhone}
                    type="tel"
                    placeholder="+224 6XX XX XX XX"
                  />
                </div>

                {/* Contract */}
                <div className="pt-10 mt-10 border-t hairline space-y-6">
                  <div className="flex items-baseline gap-3">
                    <div className="font-mono-kicker text-[10px] text-muted-foreground">
                      Contrat de cession
                    </div>
                    <span className="h-px flex-1 bg-hairline max-w-[160px]" />
                  </div>

                  <article className="paper-tile rounded-sm p-8 max-w-[640px]">
                    <div className="font-mono-kicker text-[9px] text-paper-foreground/60 mb-4">
                      Acte de cession — Maore-Tech
                    </div>
                    <div className="space-y-4 text-[14px] text-paper-foreground leading-relaxed">
                      <p>
                        Le vendeur soussigné,{" "}
                        <strong className="font-medium">
                          {firstName || "[Prénom]"} {lastName || "[Nom]"}
                        </strong>
                        , domicilié à{" "}
                        <strong className="font-medium">{village || "[Village]"}</strong>,
                        joignable au{" "}
                        <strong className="font-medium">{sellerPhone || "[téléphone]"}</strong>
                        {email ? (
                          <>
                            {" "}
                            et à l'adresse{" "}
                            <strong className="font-medium">{email}</strong>
                          </>
                        ) : null}
                        , déclare céder à <em>Maore-Tech</em> le téléphone décrit ci-après,
                        en pleine propriété, libre de tout gage.
                      </p>
                      <p>
                        Il certifie en être le propriétaire légitime et garantit l'acquéreur
                        contre tout recours d'un tiers. Le prix convenu, ci-dessous, vaut
                        transfert immédiat de propriété au règlement.
                      </p>
                    </div>
                  </article>

                  <label className="flex items-start gap-3 text-sm text-foreground cursor-pointer select-none max-w-[640px]">
                    <input
                      type="checkbox"
                      checked={contractAccepted}
                      onChange={(e) => setContractAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded-none border-foreground/30 accent-primary"
                    />
                    <span className="leading-relaxed">
                      Le vendeur a lu et accepte les termes du contrat ci-dessus.
                    </span>
                  </label>

                  <div className="max-w-[640px]">
                    <FieldLabel>Signature du vendeur *</FieldLabel>
                    <SignaturePad value={signature} onChange={setSignature} />
                  </div>
                </div>
              </>
            )}
          </Section>

          {/* Section 02 — Appareil */}
          <Section num="02" kicker="Appareil" title="Le téléphone, en détail.">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12">
              <div className="space-y-8">
                <UnderlinedField
                  label="Modèle *"
                  value={model}
                  onChange={setModel}
                  placeholder="iPhone 13 Pro, Samsung Galaxy S22…"
                />

                <div>
                  <FieldLabel>État *</FieldLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-0 border hairline">
                    {CONDITIONS.map((c, i) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCondition(c.value)}
                        className={`py-3 px-2 text-[10px] font-mono-kicker transition-all duration-300 ease-out-expo ${
                          condition === c.value
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        } ${i > 0 ? "border-l hairline" : ""}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photo */}
              <div>
                <FieldLabel>Photo (optionnelle)</FieldLabel>
                {photoUrl ? (
                  <div className="relative w-full max-w-[280px] aspect-square border hairline">
                    <img
                      src={photoUrl}
                      alt="Téléphone"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      className="absolute top-2 right-2 w-7 h-7 bg-background/90 border hairline flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
                      aria-label="Supprimer la photo"
                    >
                      <X className="w-3 h-3" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group w-full max-w-[280px] aspect-square border hairline border-dashed flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all duration-500 ease-out-expo"
                  >
                    <Camera className="w-5 h-5" strokeWidth={1.2} />
                    <span className="font-mono-kicker text-[10px]">
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
          <Section num="03" kicker="Économie" title="Le prix de l'opération.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-8 max-w-[720px]">
              <UnderlinedField
                label="Prix d'achat (€) *"
                value={purchasePrice}
                onChange={setPurchasePrice}
                type="number"
                placeholder="0"
              />
              <UnderlinedField
                label="Réparation (€)"
                value={repairPrice}
                onChange={setRepairPrice}
                type="number"
                placeholder="0"
              />
              <UnderlinedField
                label="Revente (€) *"
                value={resalePrice}
                onChange={setResalePrice}
                type="number"
                placeholder="0"
              />
            </div>

            {margin !== null && (
              <div className="border-t hairline pt-8 max-w-[720px]">
                <div className="font-mono-kicker text-[10px] text-muted-foreground mb-3">
                  Marge estimée
                </div>
                <div className="flex items-baseline gap-4">
                  <span
                    className={`font-heading text-6xl italic tabular leading-none ${
                      margin >= 0 ? "text-foreground" : "text-destructive"
                    }`}
                  >
                    {margin >= 0 ? "+" : ""}
                    {eur(margin)}
                  </span>
                  {margin < 0 && (
                    <span className="text-xs text-destructive/80">
                      Prix de revente sous le coût total.
                    </span>
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* Submit */}
          <div className="pt-8 border-t hairline flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="group inline-flex items-center gap-3 px-6 py-3.5 bg-foreground text-background text-sm font-medium hover:bg-foreground/95 disabled:opacity-40 transition-all duration-500 ease-out-expo"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={1.5} />
                  Enregistrer le téléphone
                  <span className="font-mono-kicker text-[9px] opacity-50">↵</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

function Section({
  num,
  kicker,
  title,
  children,
}: {
  num: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-8">
      <header className="flex items-baseline gap-4">
        <span className="font-mono-kicker text-[10px] text-muted-foreground">
          {num} — {kicker}
        </span>
        <span className="h-px flex-1 bg-hairline max-w-[200px]" />
        <h2 className="font-heading text-3xl text-foreground italic">{title}</h2>
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono-kicker text-[9px] text-muted-foreground mb-2">{children}</div>
  );
}

function UnderlinedField({
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
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        className="w-full px-0 py-2 bg-transparent border-0 border-b hairline focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/40 text-sm transition-colors duration-300 ease-out-expo"
      />
    </div>
  );
}
