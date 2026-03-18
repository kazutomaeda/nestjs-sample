import { z } from 'zod';
import { requiredString } from '../../../common/schema';

export const passwordResetRequestSchema = z.object({
  email: requiredString('メールアドレス')
    .email('有効なメールアドレスを入力してください')
    .openapi({ description: 'メールアドレス', example: 'user@example.com' }),
});

export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;
