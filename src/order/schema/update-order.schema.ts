import { z } from 'zod';

export const updateOrderSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.coerce.number().int().optional(),
  paid: z.boolean().optional(),
});

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
