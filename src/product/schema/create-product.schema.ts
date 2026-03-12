import { z } from 'zod';

// TODO: ドメインに合わせてフィールドを追加
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
