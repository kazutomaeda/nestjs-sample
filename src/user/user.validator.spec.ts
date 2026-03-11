import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UserModel } from './user.model';
import { UserValidator } from './user.validator';

const mockUser = new UserModel({
  id: 1,
  tenantId: 1,
  role: 'tenant_user',
  email: 'user@example.com',
  name: '山田花子',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

describe('UserValidator', () => {
  let validator: UserValidator;

  beforeEach(() => {
    validator = new UserValidator();
  });

  describe('ensureExists', () => {
    it('ユーザーが存在する場合、そのユーザーを返す', () => {
      const result = validator.ensureExists(mockUser, 1);

      expect(result).toEqual(mockUser);
    });

    it('ユーザーがnullの場合、NotFoundExceptionを投げる', () => {
      expect(() => validator.ensureExists(null, 999)).toThrow(
        NotFoundException,
      );
    });
  });

  describe('ensureEmailNotDuplicated', () => {
    it('既存ユーザーがいない場合、例外を投げない', () => {
      expect(() =>
        validator.ensureEmailNotDuplicated(null, 'new@example.com'),
      ).not.toThrow();
    });

    it('既存ユーザーがいる場合、ConflictExceptionを投げる', () => {
      expect(() =>
        validator.ensureEmailNotDuplicated(mockUser, 'user@example.com'),
      ).toThrow(ConflictException);
    });
  });

  describe('ensureNotSelf', () => {
    it('異なるユーザーIDの場合、例外を投げない', () => {
      expect(() => validator.ensureNotSelf(1, 2)).not.toThrow();
    });

    it('同じユーザーIDの場合、BadRequestExceptionを投げる', () => {
      expect(() => validator.ensureNotSelf(1, 1)).toThrow(BadRequestException);
    });
  });

  describe('ensureRoleAllowed', () => {
    it('tenant_adminの場合、例外を投げない', () => {
      expect(() => validator.ensureRoleAllowed('tenant_admin')).not.toThrow();
    });

    it('tenant_userの場合、例外を投げない', () => {
      expect(() => validator.ensureRoleAllowed('tenant_user')).not.toThrow();
    });

    it('system_adminの場合、BadRequestExceptionを投げる', () => {
      expect(() => validator.ensureRoleAllowed('system_admin')).toThrow(
        BadRequestException,
      );
    });
  });
});
