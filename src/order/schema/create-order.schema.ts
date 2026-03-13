import { z } from 'zod';

export const createOrderSchema = z.object({
  title: z.string().min(1),
  amount: z.coerce.number().int(),
  paid: z.boolean().default(false),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
