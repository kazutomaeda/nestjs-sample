import { z } from 'zod';
import { optionalString, requiredEmail } from '../../common/schema';

export const updateUserSchema = z.object({
  name: optionalString('名前').openapi({
    description: '名前',
    example: '山田花子',
  }),
  email: requiredEmail('メールアドレス').optional().openapi({
    description: 'メールアドレス',
    example: 'user@example.com',
  }),
  role: z
    .enum(['tenant_admin', 'tenant_user'])
    .optional()
    .openapi({ description: 'ロール', example: 'tenant_user' }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
