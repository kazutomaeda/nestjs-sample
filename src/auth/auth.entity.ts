import { Role } from './types';

export class User {
  id: number;
  tenantId: number | null;
  role: Role;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RefreshToken {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export class PasswordReset {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
