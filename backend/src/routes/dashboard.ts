import { Hono } from "hono";
import { prisma } from "../prisma";
import type { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const dashboardRouter = new Hono<{ Variables: Variables }>();

dashboardRouter.get("/stats", async (c) => {
  const phones = await prisma.phone.findMany({ include: { seller: true } });

  const totalPhones = phones.length;
  const soldPhones = phones.filter((p) => p.status === "sold");
  const forSalePhones = phones.filter((p) => p.status === "for_sale");

  const totalRevenue = soldPhones.reduce((sum, p) => sum + p.resalePrice, 0);
  const totalCost = soldPhones.reduce((sum, p) => sum + p.purchasePrice + p.repairPrice, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalInventoryValue = forSalePhones.reduce((sum, p) => sum + p.purchasePrice + p.repairPrice, 0);

  // Monthly revenue for the last 6 months
  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthPhones = soldPhones.filter((p) => {
      const d = new Date(p.updatedAt);
      return d >= date && d < nextDate;
    });
    const revenue = monthPhones.reduce((sum, p) => sum + p.resalePrice, 0);
    const cost = monthPhones.reduce((sum, p) => sum + p.purchasePrice + p.repairPrice, 0);
    monthlyData.push({
      month: date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      revenue,
      profit: revenue - cost,
      count: monthPhones.length,
    });
  }

  return c.json({
    data: {
      totalPhones,
      soldCount: soldPhones.length,
      forSaleCount: forSalePhones.length,
      totalRevenue,
      totalProfit,
      totalInventoryValue,
      monthlyData,
    },
  });
});
