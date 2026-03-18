import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TransactionService } from '../../prisma/transaction.service';
import { AdminAuthRepository } from './admin-auth.repository';
import { AdminAuthValidator } from './admin-auth.validator';
import { AdminModel } from '../../admin/admin.model';
import { AdminJwtPayload } from '../types';
import { MailService } from '../../mail/external/mail.service';
import {
  AdminLoginInput,
  AdminPasswordResetRequestInput,
  AdminPasswordResetConfirmInput,
} from './schema';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AdminAuthUsecase {
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresInDays: number;

  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: AdminAuthRepository,
    private readonly validator: AdminAuthValidator,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.accessTokenExpiresIn =
      this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRES_IN') ?? 900;
    this.refreshTokenExpiresInDays =
      this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS') ?? 7;
  }

  async login(
    input: AdminLoginInput,
  ): Promise<{ admin: AdminModel; tokens: TokenPair }> {
    const adminWithPassword = this.validator.ensureAdminExists(
      await this.repository.findAdminByEmail(input.email),
    );

    const isPasswordValid = await bcrypt.compare(
      input.password,
      adminWithPassword.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'メールアドレスまたはパスワードが正しくありません',
      );
    }

    const tokens = await this.generateTokens(adminWithPassword);

    const admin = new AdminModel({
      id: adminWithPassword.id,
      email: adminWithPassword.email,
      name: adminWithPassword.name,
      createdAt: adminWithPassword.createdAt,
      updatedAt: adminWithPassword.updatedAt,
    });

    return { admin, tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.transaction.run(async (tx) => {
      const token = await this.repository.findRefreshToken(refreshToken);
      if (token) {
        await this.repository.deleteRefreshToken(refreshToken, tx);
      }
    });
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const storedToken = await this.repository.findRefreshToken(refreshToken);
    this.validator.ensureRefreshTokenValid(storedToken);

    const admin = await this.repository.findAdminById(storedToken!.adminId);
    if (!admin) {
      throw new UnauthorizedException('管理者が見つかりません');
    }

    const tokens = await this.transaction.run(async (tx) => {
      await this.repository.deleteRefreshToken(refreshToken, tx);
      return this.generateTokensWithTx(admin, tx);
    });

    return tokens;
  }

  async getMe(adminId: number): Promise<AdminModel> {
    const admin = await this.repository.findAdminById(adminId);
    if (!admin) {
      throw new UnauthorizedException('管理者が見つかりません');
    }
    return admin;
  }

  async requestPasswordReset(
    input: AdminPasswordResetRequestInput,
  ): Promise<void> {
    const admin = await this.repository.findAdminByEmail(input.email);

    if (!admin) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.transaction.run(async (tx) => {
      await this.repository.createPasswordReset(
        { adminId: admin.id, token, expiresAt },
        tx,
      );
    });

    await this.mailService.send({
      to: admin.email,
      subject: 'パスワードリセットのご案内（管理者）',
      text: [
        'パスワードリセットが要求されました。',
        '',
        `リセットトークン: ${token}`,
        '',
        'このトークンは1時間有効です。',
        '心当たりがない場合はこのメールを無視してください。',
      ].join('\n'),
    });
  }

  async confirmPasswordReset(
    input: AdminPasswordResetConfirmInput,
  ): Promise<void> {
    const passwordReset = this.validator.ensurePasswordResetValid(
      await this.repository.findPasswordReset(input.token),
    );

    const passwordHash = await bcrypt.hash(input.password, 10);

    await this.transaction.run(async (tx) => {
      await this.repository.updateAdminPassword(
        passwordReset.adminId,
        passwordHash,
        tx,
      );
      await this.repository.markPasswordResetAsUsed(input.token, tx);
      await this.repository.deleteAllRefreshTokensByAdminId(
        passwordReset.adminId,
        tx,
      );
    });
  }

  private async generateTokens(admin: AdminModel): Promise<TokenPair> {
    return this.transaction.run(async (tx) => {
      return this.generateTokensWithTx(admin, tx);
    });
  }

  private async generateTokensWithTx(
    admin: AdminModel,
    tx: Parameters<Parameters<TransactionService['run']>[0]>[0],
  ): Promise<TokenPair> {
    const payload: AdminJwtPayload = {
      type: 'admin',
      sub: admin.id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.accessTokenExpiresIn,
    });

    const refreshTokenValue = crypto.randomBytes(32).toString('hex');
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(
      refreshTokenExpiresAt.getDate() + this.refreshTokenExpiresInDays,
    );

    await this.repository.createRefreshToken(
      {
        adminId: admin.id,
        token: refreshTokenValue,
        expiresAt: refreshTokenExpiresAt,
      },
      tx,
    );

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }
}
