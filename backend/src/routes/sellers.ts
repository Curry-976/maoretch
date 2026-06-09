import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { CreateSellerSchema, UpdateSellerSchema } from "../types";
import type { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

function requireAuth(c: any): Response | null {
  if (!c.get("user")) return c.json({ error: "Unauthorized" }, 401);
  return null;
}

function emptyToUndefined<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === "" ? undefined : v;
  }
  return out;
}

export const sellersRouter = new Hono<{ Variables: Variables }>();

sellersRouter.get("/", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const sellers = await prisma.seller.findMany({
    include: { phones: true },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: sellers });
});

sellersRouter.post("/", zValidator("json", CreateSellerSchema), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const body = emptyToUndefined(c.req.valid("json"));
  const data: Record<string, unknown> = { ...body };
  if (body.signatureDataUrl) {
    data.contractSignedAt = new Date();
  }
  const seller = await prisma.seller.create({ data: data as any });
  return c.json({ data: seller }, 201);
});

sellersRouter.patch("/:id", zValidator("json", UpdateSellerSchema), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const body = emptyToUndefined(c.req.valid("json"));
  const data: Record<string, unknown> = { ...body };
  if (body.signatureDataUrl) data.contractSignedAt = new Date();

  const seller = await prisma.seller.update({
    where: { id: c.req.param("id") },
    data: data as any,
  });
  return c.json({ data: seller });
});

sellersRouter.delete("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const id = c.req.param("id");
  await prisma.seller.delete({ where: { id } });
  return c.body(null, 204);
});
