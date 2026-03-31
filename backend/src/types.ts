import { z } from "zod";

export const CreateSellerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  village: z.string().min(1),
});

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

export type CreateSeller = z.infer<typeof CreateSellerSchema>;
export type CreatePhone = z.infer<typeof CreatePhoneSchema>;
export type UpdatePhone = z.infer<typeof UpdatePhoneSchema>;
