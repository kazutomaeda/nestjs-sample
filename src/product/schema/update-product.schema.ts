import { z } from 'zod';

// TODO: ドメインに合わせてフィールドを追加
export const updateProductSchema = z.object({});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
