import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionClient } from '../../prisma/prisma.types';
import { UserModel, UserWithPasswordModel } from '../../user/user.model';
import { User, UserRefreshToken, UserPasswordReset } from './user-auth.entity';
import { UserRole, isValidUserRole } from '../types';
import { ResourceId } from '../../common/types/id.type';

@Injectable()
export class UserAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<UserWithPasswordModel | null> {
    const entity = await this.prisma.user.findUnique({
      where: { email },
    });
    return entity ? this.toUserWithPasswordModel(entity as User) : null;
  }

  async findUserById(id: ResourceId): Promise<UserModel | null> {
    const entity = await this.prisma.user.findUnique({
      where: { id },
    });
    return entity ? this.toUserModel(entity as User) : null;
  }

  async createRefreshToken(
    params: { userId: ResourceId; token: string; expiresAt: Date },
    tx: TransactionClient,
  ): Promise<void> {
    await tx.userRefreshToken.create({
      data: {
        userId: params.userId,
        token: params.token,
        expiresAt: params.expiresAt,
      },
    });
  }

  async findRefreshToken(token: string): Promise<UserRefreshToken | null> {
    const entity = await this.prisma.userRefreshToken.findUnique({
      where: { token },
    });
    return entity as UserRefreshToken | null;
  }

  async deleteRefreshToken(
    token: string,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.userRefreshToken.delete({
      where: { token },
    });
  }

  async deleteAllRefreshTokensByUserId(
    userId: ResourceId,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.userRefreshToken.deleteMany({
      where: { userId },
    });
  }

  async createPasswordReset(
    params: { userId: ResourceId; token: string; expiresAt: Date },
    tx: TransactionClient,
  ): Promise<void> {
    await tx.userPasswordReset.create({
      data: {
        userId: params.userId,
        token: params.token,
        expiresAt: params.expiresAt,
      },
    });
  }

  async findPasswordReset(token: string): Promise<UserPasswordReset | null> {
    const entity = await this.prisma.userPasswordReset.findUnique({
      where: { token },
    });
    return entity as UserPasswordReset | null;
  }

  async markPasswordResetAsUsed(
    token: string,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.userPasswordReset.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  async updateUserPassword(
    userId: ResourceId,
    passwordHash: string,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  private toUserModel(entity: User): UserModel {
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

  private toUserWithPasswordModel(entity: User): UserWithPasswordModel {
    const role: UserRole = isValidUserRole(entity.role)
      ? entity.role
      : 'tenant_user';
    return new UserWithPasswordModel({
      id: entity.id,
      tenantId: entity.tenantId,
      role,
      email: entity.email,
      name: entity.name,
      passwordHash: entity.passwordHash,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
