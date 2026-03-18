import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionClient } from '../../prisma/prisma.types';
import { UserModel } from '../user.model';
import { User } from '../user.entity';
import { UserRole, isValidUserRole } from '../../auth/types';
import { AppAbility } from '../../auth/external/casl-ability.factory';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ability: AppAbility): Promise<UserModel[]> {
    const entities = await this.prisma.user.findMany({
      where: accessibleBy(ability).User,
      orderBy: { createdAt: 'desc' },
    });
    return entities.map((entity) => this.toModel(entity as User));
  }

  async findById(id: number, ability: AppAbility): Promise<UserModel | null> {
    const entity = await this.prisma.user.findFirst({
      where: {
        id,
        AND: [accessibleBy(ability).User],
      },
    });
    return entity ? this.toModel(entity as User) : null;
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const entity = await this.prisma.user.findUnique({
      where: { email },
    });
    return entity ? this.toModel(entity as User) : null;
  }

  async create(
    params: {
      tenantId: number;
      role: UserRole;
      email: string;
      passwordHash: string;
      name: string;
    },
    tx: TransactionClient,
  ): Promise<UserModel> {
    const entity = await tx.user.create({
      data: {
        tenantId: params.tenantId,
        role: params.role,
        email: params.email,
        passwordHash: params.passwordHash,
        name: params.name,
      },
    });
    return this.toModel(entity as User);
  }

  async update(
    id: number,
    model: UserModel,
    tx: TransactionClient,
  ): Promise<UserModel> {
    const entity = await tx.user.update({
      where: { id },
      data: {
        name: model.name,
        email: model.email,
        role: model.role,
      },
    });
    return this.toModel(entity as User);
  }

  async delete(id: number, tx: TransactionClient): Promise<UserModel> {
    const entity = await tx.user.delete({
      where: { id },
    });
    return this.toModel(entity as User);
  }

  private toModel(entity: User): UserModel {
    const role: UserRole = isValidUserRole(entity.role)
      ? entity.role
      : 'tenant_user';
    return new UserModel({
      id: entity.id,
      tenantId: entity.tenantId,
      role,
      email: entity.email,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
