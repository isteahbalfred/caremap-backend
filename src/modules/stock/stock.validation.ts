import { z } from 'zod';

export const UpdateStockSchema = z.object({
  quantity: z.number().int().min(0, 'Quantité invalide'),
  price: z.number().positive('Prix invalide'),
  threshold: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

export const AddStockSchema = z.object({
  medicationId: z.string().uuid('ID médicament invalide'),
  quantity: z.number().int().min(0),
  price: z.number().positive('Prix invalide'),
  threshold: z.number().int().min(0).optional(),
});

export type UpdateStockDto = z.infer<typeof UpdateStockSchema>;
export type AddStockDto = z.infer<typeof AddStockSchema>;