import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TransactionService } from '../prisma/transaction.service';
import { AuthRepository } from './auth.repository';
import { AuthValidator } from './auth.validator';
import { UserModel } from '../user/user.model';
import { JwtPayload } from './types';
import {
  LoginInput,
  PasswordResetRequestInput,
  PasswordResetConfirmInput,
} from './schema';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthUsecase {
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresInDays: number;

  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: AuthRepository,
    private readonly validator: AuthValidator,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenExpiresIn =
      this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRES_IN') ?? 900; // 15分
    this.refreshTokenExpiresInDays =
      this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS') ?? 7;
  }

  async login(
    input: LoginInput,
  ): Promise<{ user: UserModel; tokens: TokenPair }> {
    const userWithPassword = this.validator.ensureUserExists(
      await this.repository.findUserByEmail(input.email),
    );

    const isPasswordValid = await bcrypt.compare(
      input.password,
      userWithPassword.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'メールアドレスまたはパスワードが正しくありません',
      );
    }

    const tokens = await this.generateTokens(userWithPassword);

    const user = new UserModel({
      id: userWithPassword.id,
      tenantId: userWithPassword.tenantId,
      role: userWithPassword.role,
      email: userWithPassword.email,
      name: userWithPassword.name,
      createdAt: userWithPassword.createdAt,
      updatedAt: userWithPassword.updatedAt,
    });

    return { user, tokens };
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

    const user = await this.repository.findUserById(storedToken!.userId);
    if (!user) {
      throw new UnauthorizedException('ユーザーが見つかりません');
    }

    // 古いトークンを削除して新しいトークンを生成
    const tokens = await this.transaction.run(async (tx) => {
      await this.repository.deleteRefreshToken(refreshToken, tx);
      return this.generateTokensWithTx(user, tx);
    });

    return tokens;
  }

  async getMe(userId: number): Promise<UserModel> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('ユーザーが見つかりません');
    }
    return user;
  }

  async requestPasswordReset(input: PasswordResetRequestInput): Promise<void> {
    const user = await this.repository.findUserByEmail(input.email);

    // ユーザーが存在しなくても成功を返す（セキュリティ上の理由）
    if (!user) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1時間有効

    await this.transaction.run(async (tx) => {
      await this.repository.createPasswordReset(
        { userId: user.id, token, expiresAt },
        tx,
      );
    });

    // TODO: メール送信処理
    // await this.mailService.sendPasswordResetEmail(user.email, token);
  }

  async confirmPasswordReset(input: PasswordResetConfirmInput): Promise<void> {
    const passwordReset = this.validator.ensurePasswordResetValid(
      await this.repository.findPasswordReset(input.token),
    );

    const passwordHash = await bcrypt.hash(input.password, 10);

    await this.transaction.run(async (tx) => {
      await this.repository.updateUserPassword(
        passwordReset.userId,
        passwordHash,
        tx,
      );
      await this.repository.markPasswordResetAsUsed(input.token, tx);
      // すべてのリフレッシュトークンを無効化
      await this.repository.deleteAllRefreshTokensByUserId(
        passwordReset.userId,
        tx,
      );
    });
  }

  private async generateTokens(user: UserModel): Promise<TokenPair> {
    return this.transaction.run(async (tx) => {
      return this.generateTokensWithTx(user, tx);
    });
  }

  private async generateTokensWithTx(
    user: UserModel,
    tx: Parameters<Parameters<TransactionService['run']>[0]>[0],
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
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
        userId: user.id,
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
