export interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  village: string;
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
