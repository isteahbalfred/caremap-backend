import { z } from 'zod';

export const CreateClinicSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  address: z.string().min(5, 'Adresse trop courte'),
  city: z.string().min(2, 'Ville requise'),
  phone: z.string().min(8, 'Téléphone invalide'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  logoUrl: z.string().url().optional(),
});

export const UpdateClinicSchema = CreateClinicSchema.partial();

export type CreateClinicDto = z.infer<typeof CreateClinicSchema>;
export type UpdateClinicDto = z.infer<typeof UpdateClinicSchema>;