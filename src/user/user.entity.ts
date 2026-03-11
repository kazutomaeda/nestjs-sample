export class User {
  id: number;
  tenantId: number | null;
  role: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
