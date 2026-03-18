import { UserRole } from '../types';

export class User {
  id: number;
  tenantId: number;
  role: UserRole;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRefreshToken {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export class UserPasswordReset {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
