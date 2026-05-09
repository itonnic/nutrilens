import { z } from 'zod';

export const CreateWaterSchema = z.object({
  amountMl: z.number().int().positive().max(5000),
  loggedAt: z.string().datetime().optional(),
});
export type CreateWaterInput = z.infer<typeof CreateWaterSchema>;

export interface WaterEntryResponse {
  id: string;
  amountMl: number;
  loggedAt: string;
  createdAt: string;
}
