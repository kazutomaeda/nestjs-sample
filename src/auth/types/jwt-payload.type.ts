import { UserRole } from './role.type';

export interface AdminJwtPayload {
  type: 'admin';
  sub: number;
  iat?: number;
  exp?: number;
}

export interface UserJwtPayload {
  type: 'user';
  sub: number;
  tenantId: number;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export type JwtPayload = AdminJwtPayload | UserJwtPayload;
