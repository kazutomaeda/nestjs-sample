import { z } from 'zod';
import { optionalString } from '../../common/schema';

export const updateTenantSchema = z.object({
  name: optionalString('テナント名').openapi({
    description: 'テナント名',
    example: '株式会社サンプル',
  }),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
