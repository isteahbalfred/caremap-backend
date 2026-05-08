import { z } from 'zod';

export const CreateMedicationSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  genericName: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid('ID catégorie invalide'),
  imageUrl: z.string().url().optional(),
});

export const UpdateMedicationSchema = CreateMedicationSchema.partial();

export type CreateMedicationDto = z.infer<typeof CreateMedicationSchema>;
export type UpdateMedicationDto = z.infer<typeof UpdateMedicationSchema>;