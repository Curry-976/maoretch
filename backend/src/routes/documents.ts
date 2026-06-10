import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";
import { CreateDocumentSchema, UpdateDocumentSchema } from "../types";
import { sendMail } from "../lib/mail";
import { renderDocumentEmail } from "../lib/document-mail";
import type { auth } from "../auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

function requireAuth(c: any): Response | null {
  if (!c.get("user")) return c.json({ error: "Unauthorized" }, 401);
  return null;
}

function emptyToNull<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === "" ? null : v;
  }
  return out;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function nextNumber(type: "quote" | "invoice"): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = type === "quote" ? "DEV" : "FAC";
  const yearPrefix = `${prefix}-${year}-`;

  const latest = await prisma.document.findFirst({
    where: { type, number: { startsWith: yearPrefix } },
    orderBy: { number: "desc" },
  });

  let nextSeq = 1;
  if (latest) {
    const m = latest.number.match(/(\d+)$/);
    if (m) nextSeq = Number(m[1]) + 1;
  }
  return `${yearPrefix}${String(nextSeq).padStart(3, "0")}`;
}

export const documentsRouter = new Hono<{ Variables: Variables }>();

documentsRouter.get("/", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const type = c.req.query("type");
  const status = c.req.query("status");
  const where: Record<string, unknown> = {};
  if (type === "quote" || type === "invoice") where.type = type;
  if (status) where.status = status;

  const documents = await prisma.document.findMany({
    where,
    include: { lines: { orderBy: { position: "asc" } }, client: true },
    orderBy: { issuedAt: "desc" },
  });
  return c.json({ data: documents });
});

documentsRouter.get("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const doc = await prisma.document.findUnique({
    where: { id: c.req.param("id") },
    include: { lines: { orderBy: { position: "asc" } }, client: true },
  });
  if (!doc) return c.json({ error: "Not found" }, 404);
  return c.json({ data: doc });
});

documentsRouter.post("/", zValidator("json", CreateDocumentSchema), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const body = c.req.valid("json");
  const cleaned = emptyToNull(body);

  // Compute totals from lines
  const lines = body.lines.map((l, i) => ({
    label: l.label,
    description: l.description || null,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    total: round2(l.quantity * l.unitPrice),
    position: l.position ?? i,
  }));
  const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
  const taxRate = body.taxRate ?? 0;
  const taxAmount = round2((subtotal * taxRate) / 100);
  const total = round2(subtotal + taxAmount);

  const number = await nextNumber(body.type);

  const document = await prisma.document.create({
    data: {
      type: body.type,
      number,
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : new Date(),
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      status: body.status ?? "draft",
      clientId: cleaned.clientId ?? null,
      clientName: body.clientName,
      clientEmail: cleaned.clientEmail ?? null,
      clientPhone: cleaned.clientPhone ?? null,
      clientAddress: cleaned.clientAddress ?? null,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: cleaned.notes ?? null,
      paymentTerms: cleaned.paymentTerms ?? null,
      paymentMethod: cleaned.paymentMethod ?? null,
      lines: { create: lines },
    },
    include: { lines: { orderBy: { position: "asc" } }, client: true },
  });
  return c.json({ data: document }, 201);
});

documentsRouter.patch("/:id", zValidator("json", UpdateDocumentSchema), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const id = c.req.param("id");
  const body = c.req.valid("json");
  const cleaned = emptyToNull(body);

  const data: Record<string, unknown> = {};
  if (body.clientId !== undefined) data.clientId = cleaned.clientId ?? null;
  if (body.clientName !== undefined) data.clientName = body.clientName;
  if (body.clientEmail !== undefined) data.clientEmail = cleaned.clientEmail ?? null;
  if (body.clientPhone !== undefined) data.clientPhone = cleaned.clientPhone ?? null;
  if (body.clientAddress !== undefined) data.clientAddress = cleaned.clientAddress ?? null;
  if (body.issuedAt) data.issuedAt = new Date(body.issuedAt);
  if (body.dueAt) data.dueAt = new Date(body.dueAt);
  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "paid") data.paidAt = new Date();
    if (body.status !== "paid") data.paidAt = null;
  }
  if (body.notes !== undefined) data.notes = cleaned.notes ?? null;
  if (body.paymentTerms !== undefined) data.paymentTerms = cleaned.paymentTerms ?? null;
  if (body.paymentMethod !== undefined) data.paymentMethod = cleaned.paymentMethod ?? null;

  // If lines or taxRate are present, recompute totals.
  if (body.lines || body.taxRate !== undefined) {
    const existing = await prisma.document.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const lines = (body.lines ?? existing.lines).map((l, i) => ({
      label: l.label,
      description: ("description" in l ? l.description : null) || null,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      total: round2(l.quantity * l.unitPrice),
      position: l.position ?? i,
    }));
    const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
    const taxRate = body.taxRate ?? existing.taxRate;
    const taxAmount = round2((subtotal * taxRate) / 100);
    const total = round2(subtotal + taxAmount);

    data.subtotal = subtotal;
    data.taxRate = taxRate;
    data.taxAmount = taxAmount;
    data.total = total;

    if (body.lines) {
      await prisma.documentLine.deleteMany({ where: { documentId: id } });
      data.lines = { create: lines };
    }
  }

  const updated = await prisma.document.update({
    where: { id },
    data,
    include: { lines: { orderBy: { position: "asc" } }, client: true },
  });
  return c.json({ data: updated });
});

documentsRouter.delete("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  await prisma.document.delete({ where: { id: c.req.param("id") } });
  return c.body(null, 204);
});

/** Convert an accepted quote into a fresh invoice (new number, same content). */
documentsRouter.post("/:id/convert-to-invoice", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const quote = await prisma.document.findUnique({
    where: { id: c.req.param("id") },
    include: { lines: { orderBy: { position: "asc" } } },
  });
  if (!quote) return c.json({ error: "Not found" }, 404);
  if (quote.type !== "quote") {
    return c.json({ error: "Only quotes can be converted" }, 400);
  }

  const number = await nextNumber("invoice");
  const invoice = await prisma.document.create({
    data: {
      type: "invoice",
      number,
      issuedAt: new Date(),
      status: "sent",
      clientId: quote.clientId,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      clientAddress: quote.clientAddress,
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      total: quote.total,
      notes: quote.notes,
      paymentTerms: quote.paymentTerms,
      lines: {
        create: quote.lines.map((l) => ({
          label: l.label,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.total,
          position: l.position,
        })),
      },
    },
    include: { lines: { orderBy: { position: "asc" } }, client: true },
  });
  return c.json({ data: invoice }, 201);
});

// ---------- Email send ----------
const SendEmailSchema = z.object({
  to: z.string().email(),
  message: z.string().optional(),
  replyTo: z.string().email().optional().or(z.literal("")),
  markAsSent: z.boolean().optional().default(true),
});

documentsRouter.post(
  "/:id/send-email",
  zValidator("json", SendEmailSchema),
  async (c) => {
    const unauth = requireAuth(c);
    if (unauth) return unauth;

    const id = c.req.param("id");
    const body = c.req.valid("json");

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { lines: { orderBy: { position: "asc" } } },
    });
    if (!doc) return c.json({ error: "Not found" }, 404);

    const { subject, html } = renderDocumentEmail(doc, body.message);

    try {
      const result = await sendMail({
        to: body.to,
        subject,
        html,
        replyTo: body.replyTo || undefined,
      });

      // Flip to "sent" if appropriate
      if (body.markAsSent && (doc.status === "draft" || doc.status === "accepted")) {
        await prisma.document.update({
          where: { id },
          data: { status: "sent" },
        });
      }

      return c.json({ data: { ok: true, dev: result.dev ?? false } });
    } catch (err: any) {
      return c.json(
        { error: err?.message || "Échec de l'envoi de l'email" },
        500,
      );
    }
  },
);

documentsRouter.get("/_meta/next-number/:type", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const type = c.req.param("type");
  if (type !== "quote" && type !== "invoice") {
    return c.json({ error: "Invalid type" }, 400);
  }
  const number = await nextNumber(type);
  return c.json({ data: { number } });
});
