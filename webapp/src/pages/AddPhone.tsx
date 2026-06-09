import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Seller, Phone } from "@/lib/types";
import { Layout } from "@/components/Layout";
import { toast } from "sonner";
import { Camera, User, Smartphone, DollarSign, ChevronDown, Loader2, X, Check, Plus, FileSignature, Mail, Phone as PhoneIcon } from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";

const CONDITIONS = [
  { value: "Neuf", label: "Neuf" },
  { value: "Très bon état", label: "Très bon état" },
  { value: "Bon état", label: "Bon état" },
  { value: "Usagé", label: "Usagé" },
  { value: "À réparer", label: "À réparer" },
];

type SellerMode = "new" | "existing";

export default function AddPhone() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seller fields
  const [sellerMode, setSellerMode] = useState<SellerMode>("new");
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [village, setVillage] = useState("");
  const [email, setEmail] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [contractAccepted, setContractAccepted] = useState(false);

  // Phone fields
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
      toast.success("Téléphone ajouté avec succès !");
      navigate("/phones");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'ajout");
    },
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
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        setPhotoUrl(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const margin = purchasePrice && resalePrice
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
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-heading text-4xl text-foreground tracking-wide">AJOUTER UN TÉLÉPHONE</h1>
          <p className="text-muted-foreground mt-1">Enregistrez un nouveau téléphone à revendre</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Seller info */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl text-foreground tracking-wide">INFORMATIONS VENDEUR</h2>
            </div>

            {/* Toggle new/existing */}
            <div className="flex gap-2">
              {(["new", "existing"] as SellerMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSellerMode(mode)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    sellerMode === mode ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "new" ? (
                    <span className="flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Nouveau vendeur</span>
                  ) : (
                    <span className="flex items-center justify-center gap-1"><User className="w-3.5 h-3.5" /> Vendeur existant</span>
                  )}
                </button>
              ))}
            </div>

            {sellerMode === "existing" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sélectionner un vendeur</label>
                <div className="relative">
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  >
                    <option value="">-- Choisir un vendeur --</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.village})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Prénom *</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean"
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom *</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont"
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Village *</label>
                    <input type="text" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Conakry"
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email *
                    </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vendeur@exemple.com"
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <PhoneIcon className="w-3.5 h-3.5" /> Téléphone *
                    </label>
                    <input type="tel" value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} placeholder="+224 6XX XX XX XX"
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
                  </div>
                </div>

                {/* Contract + signature */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-primary" />
                    <h3 className="font-medium text-foreground">Contrat de cession</h3>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-4 max-h-40 overflow-y-auto text-xs text-muted-foreground leading-relaxed space-y-2">
                    <p>
                      Le vendeur soussigné, <strong className="text-foreground">{firstName || "[Prénom]"} {lastName || "[Nom]"}</strong>,
                      domicilié à <strong className="text-foreground">{village || "[Village]"}</strong>, joignable au{" "}
                      <strong className="text-foreground">{sellerPhone || "[téléphone]"}</strong>
                      {email ? <> et à l'adresse <strong className="text-foreground">{email}</strong></> : null},
                      déclare céder à <strong className="text-foreground">Maore-Tech</strong> le ou les téléphones
                      mobiles décrits dans le présent enregistrement, en pleine propriété, libres de tout gage et de
                      toute opposition.
                    </p>
                    <p>
                      Le vendeur certifie être le propriétaire légitime des appareils et garantit Maore-Tech contre
                      tout recours d'un tiers. Le prix convenu est celui inscrit ci-dessous, et son règlement vaut
                      transfert immédiat de propriété. Toute fausse déclaration engage la responsabilité du vendeur.
                    </p>
                  </div>

                  <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={contractAccepted}
                      onChange={(e) => setContractAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-border accent-primary"
                    />
                    <span>Le vendeur a lu et accepte les termes du contrat ci-dessus.</span>
                  </label>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Signature du vendeur *</label>
                    <SignaturePad value={signature} onChange={setSignature} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Section: Phone info */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl text-foreground tracking-wide">INFORMATIONS TÉLÉPHONE</h2>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Modèle *</label>
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="iPhone 13 Pro, Samsung Galaxy S22..." required
                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">État *</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCondition(c.value)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all text-center ${
                      condition === c.value
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Photo du téléphone</label>
              {photoUrl ? (
                <div className="relative w-40 h-40">
                  <img src={photoUrl} alt="Téléphone" className="w-full h-full object-cover rounded-xl border border-border" />
                  <button type="button" onClick={() => setPhotoUrl("")}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-40 h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-all"
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-xs text-center px-2">Ajouter une photo</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            </div>
          </div>

          {/* Section: Prices */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl text-foreground tracking-wide">PRIX</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Prix d'achat (€) *</label>
                <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0" min="0" required
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Prix réparation (€)</label>
                <input type="number" value={repairPrice} onChange={(e) => setRepairPrice(e.target.value)} placeholder="0" min="0"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Prix de revente (€) *</label>
                <input type="number" value={resalePrice} onChange={(e) => setResalePrice(e.target.value)} placeholder="0" min="0" required
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
              </div>
            </div>

            {/* Margin preview */}
            {margin !== null && (
              <div className={`p-4 rounded-lg border ${margin >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-destructive/10 border-destructive/20"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Marge estimée</span>
                  <span className={`text-lg font-bold ${margin >= 0 ? "text-green-400" : "text-destructive"}`}>
                    {margin >= 0 ? "+" : ""}{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(margin)}
                  </span>
                </div>
                {margin < 0 && <p className="text-xs text-destructive/70 mt-1">Attention : prix de revente inférieur au coût total</p>}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <><Check className="w-5 h-5" /> Enregistrer le téléphone</>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
