import { Hono } from "hono";
import { prisma } from "../prisma";
import type { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

function requireAuth(c: any): Response | null {
  if (!c.get("user")) return c.json({ error: "Unauthorized" }, 401);
  return null;
}

export const activityRouter = new Hono<{ Variables: Variables }>();

/**
 * Build a unified activity feed by merging recent Phones, Sellers and Clients.
 * Each event has: id, type, timestamp, title, subtitle, status?, amount?
 */
activityRouter.get("/", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const [phones, sellers, clients] = await Promise.all([
    prisma.phone.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: { seller: true },
    }),
    prisma.seller.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.client.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  type Event = {
    id: string;
    type: "phone_added" | "phone_sold" | "seller_added" | "client_added" | "client_verified";
    timestamp: string;
    title: string;
    subtitle?: string;
    amount?: number;
  };

  const events: Event[] = [];

  for (const p of phones) {
    if (p.status === "sold" && p.soldAt) {
      events.push({
        id: `phone-sold-${p.id}`,
        type: "phone_sold",
        timestamp: p.soldAt.toISOString(),
        title: `${p.model} vendu`,
        subtitle: `Vendeur : ${p.seller.firstName} ${p.seller.lastName} · ${p.seller.village}`,
        amount: p.resalePrice,
      });
    }
    events.push({
      id: `phone-added-${p.id}`,
      type: "phone_added",
      timestamp: p.createdAt.toISOString(),
      title: `${p.model} ajouté`,
      subtitle: `Acheté à ${p.seller.firstName} ${p.seller.lastName} pour ${p.purchasePrice} €`,
      amount: p.purchasePrice,
    });
  }

  for (const s of sellers) {
    events.push({
      id: `seller-${s.id}`,
      type: "seller_added",
      timestamp: s.createdAt.toISOString(),
      title: `${s.firstName} ${s.lastName} enregistré`,
      subtitle: `Vendeur · ${s.village}`,
    });
  }

  for (const cl of clients) {
    events.push({
      id: `client-${cl.id}`,
      type: "client_added",
      timestamp: cl.createdAt.toISOString(),
      title: `${cl.firstName} ${cl.lastName} ajouté au CRM`,
      subtitle: cl.village ? `Client · ${cl.village}` : "Client",
    });
    if (cl.verifiedAt) {
      events.push({
        id: `client-verified-${cl.id}`,
        type: "client_verified",
        timestamp: cl.verifiedAt.toISOString(),
        title: `${cl.firstName} ${cl.lastName} vérifié`,
        subtitle: "Client démarché et validé",
      });
    }
  }

  events.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
  return c.json({ data: events.slice(0, 50) });
});

export default activityRouter;
