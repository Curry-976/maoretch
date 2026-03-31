import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { CreateSellerSchema } from "../types";
import type { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const sellersRouter = new Hono<{ Variables: Variables }>();

// List all sellers
sellersRouter.get("/", async (c) => {
  const sellers = await prisma.seller.findMany({
    include: { phones: true },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: sellers });
});

// Create a seller
sellersRouter.post("/", zValidator("json", CreateSellerSchema), async (c) => {
  const body = c.req.valid("json");
  const seller = await prisma.seller.create({ data: body });
  return c.json({ data: seller }, 201);
});

// Delete a seller
sellersRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.seller.delete({ where: { id } });
  return c.body(null, 204);
});
