import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { CreatePartSchema, UpdatePartSchema } from "../types";
import type { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

function requireAuth(c: any): Response | null {
  if (!c.get("user")) return c.json({ error: "Unauthorized" }, 401);
  return null;
}

function nullEmpty<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === "" ? null : v;
  }
  return out;
}

export const partsRouter = new Hono<{ Variables: Variables }>();

partsRouter.get("/", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const parts = await prisma.part.findMany({
    orderBy: [{ deviceBrand: "asc" }, { deviceModel: "asc" }, { type: "asc" }],
  });
  return c.json({ data: parts });
});

partsRouter.post("/", zValidator("json", CreatePartSchema), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const part = await prisma.part.create({ data: nullEmpty(c.req.valid("json")) });
  return c.json({ data: part }, 201);
});

partsRouter.patch("/:id", zValidator("json", UpdatePartSchema), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const part = await prisma.part.update({
    where: { id: c.req.param("id") },
    data: nullEmpty(c.req.valid("json")),
  });
  return c.json({ data: part });
});

partsRouter.delete("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  await prisma.part.delete({ where: { id: c.req.param("id") } });
  return c.body(null, 204);
});
