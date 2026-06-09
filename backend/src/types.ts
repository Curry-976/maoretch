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
  model: z.string().min(1),
  condition: z.string().min(1),
  photoUrl: z.string().optional(),
  purchasePrice: z.number().positive(),
  repairPrice: z.number().min(0).default(0),
  resalePrice: z.number().positive(),
  sellerId: z.string().min(1),
});

export const UpdatePhoneSchema = z.object({
  model: z.string().min(1).optional(),
  condition: z.string().min(1).optional(),
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
