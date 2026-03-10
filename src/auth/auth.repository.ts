import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionClient } from '../prisma/prisma.types';
import { UserModel, UserWithPasswordModel } from './auth.model';
import { User, RefreshToken, PasswordReset } from './auth.entity';
import { Role, isValidRole } from './types';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<UserWithPasswordModel | null> {
    const entity = await this.prisma.user.findUnique({
      where: { email },
    });
    return entity ? this.toUserWithPasswordModel(entity as User) : null;
  }

  async findUserById(id: number): Promise<UserModel | null> {
    const entity = await this.prisma.user.findUnique({
      where: { id },
    });
    return entity ? this.toUserModel(entity as User) : null;
  }

  async createRefreshToken(
    params: { userId: number; token: string; expiresAt: Date },
    tx: TransactionClient,
  ): Promise<void> {
    await tx.refreshToken.create({
      data: {
        userId: params.userId,
        token: params.token,
        expiresAt: params.expiresAt,
      },
    });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    const entity = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    return entity as RefreshToken | null;
  }

  async deleteRefreshToken(token: string, tx: TransactionClient): Promise<void> {
    await tx.refreshToken.delete({
      where: { token },
    });
  }

  async deleteAllRefreshTokensByUserId(
    userId: number,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async createPasswordReset(
    params: { userId: number; token: string; expiresAt: Date },
    tx: TransactionClient,
  ): Promise<void> {
    await tx.passwordReset.create({
      data: {
        userId: params.userId,
        token: params.token,
        expiresAt: params.expiresAt,
      },
    });
  }

  async findPasswordReset(token: string): Promise<PasswordReset | null> {
    const entity = await this.prisma.passwordReset.findUnique({
      where: { token },
    });
    return entity as PasswordReset | null;
  }

  async markPasswordResetAsUsed(
    token: string,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.passwordReset.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  async updateUserPassword(
    userId: number,
    passwordHash: string,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  private toUserModel(entity: User): UserModel {
    const role: Role = isValidRole(entity.role) ? entity.role : 'tenant_user';
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
    const role: Role = isValidRole(entity.role) ? entity.role : 'tenant_user';
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
