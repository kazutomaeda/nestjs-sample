import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionClient } from '../../prisma/prisma.types';
import { AdminModel, AdminWithPasswordModel } from '../../admin/admin.model';
import {
  Admin,
  AdminRefreshToken,
  AdminPasswordReset,
} from './admin-auth.entity';

@Injectable()
export class AdminAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAdminByEmail(
    email: string,
  ): Promise<AdminWithPasswordModel | null> {
    const entity = await this.prisma.admin.findUnique({
      where: { email },
    });
    return entity ? this.toAdminWithPasswordModel(entity as Admin) : null;
  }

  async findAdminById(id: number): Promise<AdminModel | null> {
    const entity = await this.prisma.admin.findUnique({
      where: { id },
    });
    return entity ? this.toAdminModel(entity as Admin) : null;
  }

  async createRefreshToken(
    params: { adminId: number; token: string; expiresAt: Date },
    tx: TransactionClient,
  ): Promise<void> {
    await tx.adminRefreshToken.create({
      data: {
        adminId: params.adminId,
        token: params.token,
        expiresAt: params.expiresAt,
      },
    });
  }

  async findRefreshToken(token: string): Promise<AdminRefreshToken | null> {
    const entity = await this.prisma.adminRefreshToken.findUnique({
      where: { token },
    });
    return entity as AdminRefreshToken | null;
  }

  async deleteRefreshToken(
    token: string,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.adminRefreshToken.delete({
      where: { token },
    });
  }

  async deleteAllRefreshTokensByAdminId(
    adminId: number,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.adminRefreshToken.deleteMany({
      where: { adminId },
    });
  }

  async createPasswordReset(
    params: { adminId: number; token: string; expiresAt: Date },
    tx: TransactionClient,
  ): Promise<void> {
    await tx.adminPasswordReset.create({
      data: {
        adminId: params.adminId,
        token: params.token,
        expiresAt: params.expiresAt,
      },
    });
  }

  async findPasswordReset(token: string): Promise<AdminPasswordReset | null> {
    const entity = await this.prisma.adminPasswordReset.findUnique({
      where: { token },
    });
    return entity as AdminPasswordReset | null;
  }

  async markPasswordResetAsUsed(
    token: string,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.adminPasswordReset.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  async updateAdminPassword(
    adminId: number,
    passwordHash: string,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.admin.update({
      where: { id: adminId },
      data: { passwordHash },
    });
  }

  private toAdminModel(entity: Admin): AdminModel {
    return new AdminModel({
      id: entity.id,
      email: entity.email,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toAdminWithPasswordModel(entity: Admin): AdminWithPasswordModel {
    return new AdminWithPasswordModel({
      id: entity.id,
      email: entity.email,
      name: entity.name,
      passwordHash: entity.passwordHash,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
