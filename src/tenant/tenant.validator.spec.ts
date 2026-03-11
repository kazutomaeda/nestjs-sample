import { NotFoundException } from '@nestjs/common';
import { TenantModel } from './tenant.model';
import { TenantValidator } from './tenant.validator';

const mockTenant = new TenantModel({
  id: 1,
  name: '株式会社サンプル',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

describe('TenantValidator', () => {
  let validator: TenantValidator;

  beforeEach(() => {
    validator = new TenantValidator();
  });

  describe('ensureExists', () => {
    it('テナントが存在する場合、そのテナントを返す', () => {
      const result = validator.ensureExists(mockTenant, 1);

      expect(result).toEqual(mockTenant);
    });

    it('テナントがnullの場合、NotFoundExceptionを投げる', () => {
      expect(() => validator.ensureExists(null, 999)).toThrow(
        NotFoundException,
      );
    });
  });
});
