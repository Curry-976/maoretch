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
  model: string;
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
