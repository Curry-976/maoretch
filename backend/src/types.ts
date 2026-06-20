import { z } from "zod";

// ---------- Sellers ----------
export const CreateSellerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  village: z.string().min(1),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().min(1, "Téléphone requis").optional().or(z.literal("")),
  signatureDataUrl: z.string().optional(),
});

export const UpdateSellerSchema = CreateSellerSchema.partial();

// ---------- Phones ----------
export const CreatePhoneSchema = z.object({
  brand: z.string().optional().or(z.literal("")),
  model: z.string().min(1),
  storage: z.string().optional().or(z.literal("")),
  battery: z.string().optional().or(z.literal("")),
  imei: z.string().optional().or(z.literal("")),
  condition: z.string().min(1),
  damagedComponents: z.array(z.string()).optional(),
  photoUrl: z.string().optional(),
  purchasePrice: z.number().positive(),
  repairPrice: z.number().min(0).default(0),
  resalePrice: z.number().positive(),
  sellerId: z.string().min(1),
});

export const UpdatePhoneSchema = z.object({
  brand: z.string().optional().or(z.literal("")),
  model: z.string().min(1).optional(),
  storage: z.string().optional().or(z.literal("")),
  battery: z.string().optional().or(z.literal("")),
  imei: z.string().optional().or(z.literal("")),
  condition: z.string().min(1).optional(),
  damagedComponents: z.array(z.string()).optional(),
  photoUrl: z.string().optional(),
  purchasePrice: z.number().positive().optional(),
  repairPrice: z.number().min(0).optional(),
  resalePrice: z.number().positive().optional(),
  status: z.enum(["for_sale", "sold"]).optional(),
});

// ---------- Clients (CRM) ----------
export const ClientStatus = z.enum(["pending", "verified"]);

export const CreateClientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  village: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: ClientStatus.optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial();

export type CreateSeller = z.infer<typeof CreateSellerSchema>;
export type UpdateSeller = z.infer<typeof UpdateSellerSchema>;
export type CreatePhone = z.infer<typeof CreatePhoneSchema>;
export type UpdatePhone = z.infer<typeof UpdatePhoneSchema>;
export type CreateClient = z.infer<typeof CreateClientSchema>;
export type UpdateClient = z.infer<typeof UpdateClientSchema>;

// ---------- Documents (Devis / Factures) ----------
export const DocumentType = z.enum(["quote", "invoice"]);
export const DocumentStatus = z.enum([
  "draft",
  "sent",
  "accepted",
  "paid",
  "cancelled",
]);

export const DocumentLineSchema = z.object({
  phoneId: z.string().optional().or(z.literal("")),
  partId: z.string().optional().or(z.literal("")),
  label: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0),
  position: z.number().int().default(0),
});

export const CreateDocumentSchema = z.object({
  type: DocumentType,
  clientId: z.string().optional().or(z.literal("")),
  clientName: z.string().min(1),
  clientEmail: z.string().optional().or(z.literal("")),
  clientPhone: z.string().optional().or(z.literal("")),
  clientAddress: z.string().optional().or(z.literal("")),
  issuedAt: z.string().optional(),
  dueAt: z.string().optional(),
  status: DocumentStatus.optional(),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional().or(z.literal("")),
  paymentTerms: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().optional().or(z.literal("")),
  lines: z.array(DocumentLineSchema).min(1, "Au moins une ligne requise"),
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial().extend({
  lines: z.array(DocumentLineSchema).optional(),
});

export type CreateDocument = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;

// ---------- Parts (grille tarifaire) ----------
export const CreatePartSchema = z.object({
  deviceBrand: z.string().min(1),
  deviceModel: z.string().min(1),
  type: z.string().min(1),
  quality: z.string().optional().or(z.literal("")),
  price: z.number().min(0),
  notes: z.string().optional().or(z.literal("")),
});

export const UpdatePartSchema = CreatePartSchema.partial();

export type CreatePart = z.infer<typeof CreatePartSchema>;
export type UpdatePart = z.infer<typeof UpdatePartSchema>;
