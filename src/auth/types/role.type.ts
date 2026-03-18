export const USER_ROLES = ['tenant_admin', 'tenant_user'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isValidUserRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

// 後方互換
export const ROLES = ['system_admin', ...USER_ROLES] as const;
export type Role = (typeof ROLES)[number];

export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}
