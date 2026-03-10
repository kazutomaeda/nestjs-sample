export const ROLES = ['system_admin', 'tenant_admin', 'tenant_user'] as const;
export type Role = (typeof ROLES)[number];

export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}
