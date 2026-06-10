// Sample data used to show what the future of each empty state could
// look like — Maore-Tech is a private CRM for a reseller based in
// Mayotte (Mahoré). Names, villages and phone numbers reflect that.

export const GHOST_SELLERS = [
  {
    id: "g-1",
    firstName: "Said",
    lastName: "Bacar",
    village: "Mamoudzou",
    email: "said.bacar@example.yt",
    phone: "+262 639 21 45 88",
    phoneCount: 5,
    totalRevenue: 1480,
    hasContract: true,
  },
  {
    id: "g-2",
    firstName: "Halima",
    lastName: "Madi",
    village: "Koungou",
    email: "halima.madi@example.yt",
    phone: "+262 639 78 12 04",
    phoneCount: 2,
    totalRevenue: 460,
    hasContract: true,
  },
  {
    id: "g-3",
    firstName: "Bacar",
    lastName: "Hamada",
    village: "Tsingoni",
    email: "bacar.hamada@example.yt",
    phone: "+262 639 09 88 71",
    phoneCount: 3,
    totalRevenue: 850,
    hasContract: false,
  },
];

export const GHOST_CLIENTS = [
  {
    id: "gc-1",
    firstName: "Fatima",
    lastName: "Mouhssini",
    email: "fatima.m@example.yt",
    phone: "+262 639 11 22 33",
    village: "Dzaoudzi",
    notes: "Acheteuse régulière — préfère les iPhones reconditionnés.",
    status: "verified" as const,
  },
  {
    id: "gc-2",
    firstName: "Ali",
    lastName: "Ahamada",
    email: "ali.ahamada@example.yt",
    phone: "+262 639 45 88 21",
    village: "Sada",
    notes: "Démarché au marché de Mamoudzou, à recontacter sous 2 semaines.",
    status: "pending" as const,
  },
  {
    id: "gc-3",
    firstName: "Anchya",
    lastName: "Soilihi",
    email: null,
    phone: "+262 639 90 12 45",
    village: "Pamandzi",
    notes: null,
    status: "verified" as const,
  },
];

export const GHOST_PHONES = [
  {
    id: "gp-1",
    model: "iPhone 13 Pro",
    condition: "Bon état",
    seller: { firstName: "Said", lastName: "Bacar", village: "Mamoudzou" },
    purchase: 280,
    repair: 0,
    resale: 460,
    status: "for_sale" as const,
  },
  {
    id: "gp-2",
    model: "Samsung Galaxy A52",
    condition: "Très bon état",
    seller: { firstName: "Halima", lastName: "Madi", village: "Koungou" },
    purchase: 150,
    repair: 20,
    resale: 245,
    status: "for_sale" as const,
  },
  {
    id: "gp-3",
    model: "Xiaomi Redmi 9",
    condition: "Usagé",
    seller: { firstName: "Bacar", lastName: "Hamada", village: "Tsingoni" },
    purchase: 90,
    repair: 35,
    resale: 200,
    status: "sold" as const,
  },
];

export const GHOST_PIPELINE = {
  to_repair: [
    { model: "Samsung A12", seller: "Soidiki Nourchina", village: "Bandraboua", margin: 65 },
    { model: "iPhone 8", seller: "Antoissi Mladjao", village: "Chiconi", margin: 120 },
  ],
  for_sale: [
    { model: "iPhone 13", seller: "Said Bacar", village: "Mamoudzou", margin: 180 },
    { model: "Samsung A52", seller: "Halima Madi", village: "Koungou", margin: 75 },
  ],
  sold: [
    { model: "Xiaomi Redmi 9", seller: "Bacar Hamada", village: "Tsingoni", margin: 75 },
  ],
};

export const GHOST_ACTIVITY = [
  {
    type: "phone_sold" as const,
    title: "iPhone 13 Pro vendu",
    subtitle: "Vendeur : Said Bacar · Mamoudzou",
    amount: 460,
    when: "Il y a 2 h",
  },
  {
    type: "client_verified" as const,
    title: "Fatima Mouhssini vérifiée",
    subtitle: "Démarchée à Dzaoudzi · Validée",
    when: "Il y a 5 h",
  },
  {
    type: "phone_added" as const,
    title: "Samsung Galaxy A52 ajouté",
    subtitle: "Acheté à Halima Madi pour 150 €",
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
