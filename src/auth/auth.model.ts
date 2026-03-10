import { Role } from './types';

export class UserModel {
  readonly id: number;
  readonly tenantId: number | null;
  readonly role: Role;
  readonly email: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: number;
    tenantId: number | null;
    role: Role;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.tenantId = params.tenantId;
    this.role = params.role;
    this.email = params.email;
    this.name = params.name;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}

export class UserWithPasswordModel extends UserModel {
  readonly passwordHash: string;

  constructor(
    params: ConstructorParameters<typeof UserModel>[0] & {
      passwordHash: string;
    },
  ) {
    super(params);
    this.passwordHash = params.passwordHash;
  }
}
