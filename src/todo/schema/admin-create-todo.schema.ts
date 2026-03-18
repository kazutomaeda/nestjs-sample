import { z } from 'zod';
import { createTodoSchema } from './create-todo.schema';

export const adminCreateTodoSchema = createTodoSchema.extend({
  tenantId: z.coerce
    .number()
    .int()
    .positive()
    .openapi({ description: 'テナントID', example: 1 }),
});

export type AdminCreateTodoInput = z.infer<typeof adminCreateTodoSchema>;
