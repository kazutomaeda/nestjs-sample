import { z } from 'zod';
import { requiredString } from '../../../common/schema';

export const adminPasswordResetRequestSchema = z.object({
  email: requiredString('メールアドレス')
    .email('有効なメールアドレスを入力してください')
    .openapi({ description: 'メールアドレス', example: 'admin@example.com' }),
});

export type AdminPasswordResetRequestInput = z.infer<
  typeof adminPasswordResetRequestSchema
>;
