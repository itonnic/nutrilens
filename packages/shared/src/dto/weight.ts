import { z } from 'zod';

export const CreateWeightSchema = z.object({
  weightKg: z.number().min(20).max(500),
  loggedAt: z.string().datetime().optional(),
});
export type CreateWeightInput = z.infer<typeof CreateWeightSchema>;

export interface WeightEntryResponse {
  id: string;
  weightKg: number;
  loggedAt: string;
  createdAt: string;
}
