import { Role } from './role.type';

export interface JwtPayload {
  sub: number;
  tenantId: number | null;
  role: Role;
  iat?: number;
  exp?: number;
}
