import { z } from 'zod';
import { zodId } from '../../common/types/id.type';
import { createTodoSchema } from './create-todo.schema';

export const adminCreateTodoSchema = createTodoSchema.extend({
  tenantId: zodId().openapi({ description: 'テナントID', example: 1 }),
});

export type AdminCreateTodoInput = z.infer<typeof adminCreateTodoSchema>;
