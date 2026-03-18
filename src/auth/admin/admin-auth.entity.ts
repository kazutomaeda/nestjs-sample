export class Admin {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminRefreshToken {
  id: number;
  adminId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export class AdminPasswordReset {
  id: number;
  adminId: number;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
