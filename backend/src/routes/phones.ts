import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { CreatePhoneSchema, UpdatePhoneSchema } from "../types";
import type { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const phonesRouter = new Hono<{ Variables: Variables }>();

// List all phones (optional ?status=for_sale|sold)
phonesRouter.get("/", async (c) => {
  const status = c.req.query("status");
  const where =
    status === "for_sale" || status === "sold" ? { status } : {};
  const phones = await prisma.phone.findMany({
    where,
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: phones });
});

// Get a single phone
phonesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const phone = await prisma.phone.findUnique({
    where: { id },
    include: { seller: true },
  });
  if (!phone) return c.json({ error: { message: "Phone not found" } }, 404);
  return c.json({ data: phone });
});

const OPTIONAL_STRINGS = ["brand", "storage", "battery", "imei"] as const;

function nullifyOptionals(body: Record<string, any>) {
  const out: Record<string, any> = { ...body };
  for (const key of OPTIONAL_STRINGS) {
    if (key in out) out[key] = (out[key] as string | undefined)?.trim() || null;
  }
  return out;
}

// Create a phone
phonesRouter.post("/", zValidator("json", CreatePhoneSchema), async (c) => {
  const body = c.req.valid("json");
  const phone = await prisma.phone.create({
    data: nullifyOptionals(body),
    include: { seller: true },
  });
  return c.json({ data: phone }, 201);
});

// Update a phone
phonesRouter.patch("/:id", zValidator("json", UpdatePhoneSchema), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const phone = await prisma.phone.update({
    where: { id },
    data: nullifyOptionals(body),
    include: { seller: true },
  });
  return c.json({ data: phone });
});

// Delete a phone
phonesRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.phone.delete({ where: { id } });
  return c.body(null, 204);
});
