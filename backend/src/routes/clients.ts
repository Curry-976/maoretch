import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { CreateClientSchema, UpdateClientSchema } from "../types";
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

export const clientsRouter = new Hono<{ Variables: Variables }>();

clientsRouter.get("/", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const status = c.req.query("status");
  const where = status === "verified" || status === "pending" ? { status } : {};
  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: clients });
});

clientsRouter.get("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const client = await prisma.client.findUnique({
    where: { id: c.req.param("id") },
  });
  if (!client) return c.json({ error: "Not found" }, 404);
  return c.json({ data: client });
});

clientsRouter.post("/", zValidator("json", CreateClientSchema), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const body = emptyToUndefined(c.req.valid("json"));
  const client = await prisma.client.create({ data: body });
  return c.json({ data: client }, 201);
});

clientsRouter.patch("/:id", zValidator("json", UpdateClientSchema), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const body = emptyToUndefined(c.req.valid("json"));
  const data: Record<string, unknown> = { ...body };
  if (body.status === "verified") data.verifiedAt = new Date();
  if (body.status === "pending") data.verifiedAt = null;

  const client = await prisma.client.update({
    where: { id: c.req.param("id") },
    data,
  });
  return c.json({ data: client });
});

clientsRouter.delete("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  await prisma.client.delete({ where: { id: c.req.param("id") } });
  return c.body(null, 204);
});
