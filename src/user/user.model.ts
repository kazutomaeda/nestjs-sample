import { ResourceId } from '../common/types/id.type';
import { UserRole } from '../auth/types';

export class UserModel {
  readonly id: ResourceId;
  readonly tenantId: ResourceId;
  readonly role: UserRole;
  readonly email: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: ResourceId;
    tenantId: ResourceId;
    role: UserRole;
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

  withUpdate(name?: string, email?: string, role?: UserRole): UserModel {
    return new UserModel({
      id: this.id,
      tenantId: this.tenantId,
      role: role ?? this.role,
      email: email ?? this.email,
      name: name ?? this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
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
