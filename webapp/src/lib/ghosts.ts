// West African market sample data used to show what the future
// of every empty state could look like.

export const GHOST_SELLERS = [
  {
    id: "g-1",
    firstName: "Moussa",
    lastName: "Diop",
    village: "Dakar",
    email: "moussa.diop@example.sn",
    phone: "+221 77 123 45 67",
    phoneCount: 5,
    totalRevenue: 1480,
    hasContract: true,
  },
  {
    id: "g-2",
    firstName: "Aminata",
    lastName: "Sow",
    village: "Bamako",
    email: "aminata.sow@example.ml",
    phone: "+223 66 78 12 34",
    phoneCount: 2,
    totalRevenue: 460,
    hasContract: true,
  },
  {
    id: "g-3",
    firstName: "Ibrahima",
    lastName: "Ndiaye",
    village: "Conakry",
    email: "ibrahima.n@example.gn",
    phone: "+224 62 09 88 71",
    phoneCount: 3,
    totalRevenue: 850,
    hasContract: false,
  },
];

export const GHOST_CLIENTS = [
  {
    id: "gc-1",
    firstName: "Fatou",
    lastName: "Camara",
    email: "fatou.c@example.ci",
    phone: "+225 07 11 22 33",
    village: "Abidjan",
    notes: "Acheteur régulier — préfère les iPhones reconditionnés.",
    status: "verified" as const,
  },
  {
    id: "gc-2",
    firstName: "Sékou",
    lastName: "Touré",
    email: "sekou.toure@example.ml",
    phone: "+223 76 45 88 21",
    village: "Bamako",
    notes: "Démarché au marché Dibida, à recontacter dans 2 semaines.",
    status: "pending" as const,
  },
  {
    id: "gc-3",
    firstName: "Awa",
    lastName: "Diallo",
    email: null,
    phone: "+221 78 90 12 45",
    village: "Saint-Louis",
    notes: null,
    status: "verified" as const,
  },
];

export const GHOST_PHONES = [
  {
    id: "gp-1",
    model: "iPhone 13 Pro",
    condition: "Bon état",
    seller: { firstName: "Moussa", lastName: "Diop", village: "Dakar" },
    purchase: 280,
    repair: 0,
    resale: 460,
    status: "for_sale" as const,
  },
  {
    id: "gp-2",
    model: "Samsung Galaxy A52",
    condition: "Très bon état",
    seller: { firstName: "Aminata", lastName: "Sow", village: "Bamako" },
    purchase: 150,
    repair: 20,
    resale: 245,
    status: "for_sale" as const,
  },
  {
    id: "gp-3",
    model: "Xiaomi Redmi 9",
    condition: "Usagé",
    seller: { firstName: "Ibrahima", lastName: "Ndiaye", village: "Conakry" },
    purchase: 90,
    repair: 35,
    resale: 200,
    status: "sold" as const,
  },
];

export const GHOST_PIPELINE = {
  to_repair: [
    { model: "Samsung A12", seller: "Ousmane Sy", village: "Touba", margin: 65 },
    { model: "iPhone 8", seller: "Awa Diallo", village: "Saint-Louis", margin: 120 },
  ],
  for_sale: [
    { model: "iPhone 13", seller: "Moussa Diop", village: "Dakar", margin: 180 },
    { model: "Samsung A52", seller: "Aminata Sow", village: "Bamako", margin: 75 },
  ],
  sold: [
    { model: "Xiaomi Redmi 9", seller: "Ibrahima Ndiaye", village: "Conakry", margin: 75 },
  ],
};

export const GHOST_ACTIVITY = [
  {
    type: "phone_sold" as const,
    title: "iPhone 13 Pro vendu",
    subtitle: "Vendeur : Moussa Diop · Dakar",
    amount: 460,
    when: "Il y a 2 h",
  },
  {
    type: "client_verified" as const,
    title: "Fatou Camara vérifiée",
    subtitle: "Démarchée au marché Treichville · Validée",
    when: "Il y a 5 h",
  },
  {
    type: "phone_added" as const,
    title: "Samsung Galaxy A52 ajouté",
    subtitle: "Acheté à Aminata Sow pour 150 €",
    amount: 150,
    when: "Hier, 18:24",
  },
];

export function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}
