export class User {
  id: number;
  tenantId: number;
  role: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
