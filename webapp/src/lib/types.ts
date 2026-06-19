export interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  village: string;
  email: string | null;
  phone: string | null;
  signatureDataUrl: string | null;
  contractSignedAt: string | null;
  createdAt: string;
}

export interface Phone {
  id: string;
  brand: string | null;
  model: string;
  storage: string | null;
  battery: string | null;
  imei: string | null;
  condition: string;
  photoUrl: string | null;
  purchasePrice: number;
  repairPrice: number;
  resalePrice: number;
  status: "for_sale" | "sold";
  sellerId: string;
  seller: Seller;
  createdAt: string;
  updatedAt: string;
}

export type ClientStatus = "pending" | "verified";

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  village: string | null;
  status: ClientStatus;
  notes: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = "quote" | "invoice";
export type DocumentStatus = "draft" | "sent" | "accepted" | "paid" | "cancelled";

export interface DocumentLine {
  id: string;
  phoneId: string | null;
  partId: string | null;
  label: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  position: number;
}

export interface SalesDocument {
  id: string;
  type: DocumentType;
  number: string;
  issuedAt: string;
  dueAt: string | null;
  status: DocumentStatus;
  clientId: string | null;
  client: Client | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  paymentTerms: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  lines: DocumentLine[];
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  id: string;
  deviceBrand: string;
  deviceModel: string;
  type: string;
  quality: string | null;
  price: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalPhones: number;
  soldCount: number;
  forSaleCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalInventoryValue: number;
  monthlyData: {
    month: string;
    revenue: number;
    profit: number;
    count: number;
  }[];
}
