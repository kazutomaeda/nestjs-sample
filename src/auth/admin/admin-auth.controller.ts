import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AdminAuthUsecase } from './admin-auth.usecase';
import { AdminModel } from '../../admin/admin.model';
import { AdminAuthResponseDto } from './dto/admin-auth-response.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  adminLoginSchema,
  AdminLoginInput,
  adminPasswordResetRequestSchema,
  AdminPasswordResetRequestInput,
  adminPasswordResetConfirmSchema,
  AdminPasswordResetConfirmInput,
} from './schema';
import { createApiBodySchema } from '../../common/schema';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AdminJwtPayload } from '../types';

@Controller('admin/auth')
@ApiTags('admin/auth')
export class AdminAuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly adminAuthUsecase: AdminAuthUsecase,
    private readonly configService: ConfigService,
  ) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  @Post('login')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: createApiBodySchema(adminLoginSchema) })
  @ApiResponse({
    status: 200,
    description: '管理者ログイン成功',
    type: AdminAuthResponseDto,
  })
  @ApiResponse({ status: 401, description: '認証失敗' })
  async login(
    @Body(new ZodValidationPipe(adminLoginSchema)) input: AdminLoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminAuthResponseDto> {
    const { admin, tokens } = await this.adminAuthUsecase.login(input);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return this.toResponse(admin);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: '管理者ログアウト成功' })
  async logout(@Res({ passthrough: true }) res: Response): Promise<void> {
    const refreshToken = res.req.cookies?.['admin_refresh_token'];
    if (refreshToken) {
      await this.adminAuthUsecase.logout(refreshToken);
    }

    this.clearAuthCookies(res);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'トークンリフレッシュ成功' })
  @ApiResponse({ status: 401, description: 'リフレッシュトークンが無効' })
  async refresh(
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = res.req.cookies?.['admin_refresh_token'];
    if (!refreshToken) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('リフレッシュトークンがありません');
    }

    const tokens = await this.adminAuthUsecase.refresh(refreshToken);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return { message: 'トークンをリフレッシュしました' };
  }

  @Get('me')
  @ApiResponse({
    status: 200,
    description: '管理者情報取得成功',
    type: AdminAuthResponseDto,
  })
  @ApiResponse({ status: 401, description: '認証が必要' })
  async getMe(
    @CurrentUser() user: AdminJwtPayload,
  ): Promise<AdminAuthResponseDto> {
    const adminModel = await this.adminAuthUsecase.getMe(user.sub);
    return this.toResponse(adminModel);
  }

  @Post('password-reset/request')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: createApiBodySchema(adminPasswordResetRequestSchema) })
  @ApiResponse({
    status: 200,
    description:
      'パスワードリセットメール送信（管理者が存在しない場合も成功を返す）',
  })
  async requestPasswordReset(
    @Body(new ZodValidationPipe(adminPasswordResetRequestSchema))
    input: AdminPasswordResetRequestInput,
  ): Promise<{ message: string }> {
    await this.adminAuthUsecase.requestPasswordReset(input);
    return { message: 'パスワードリセットメールを送信しました' };
  }

  @Post('password-reset/confirm')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: createApiBodySchema(adminPasswordResetConfirmSchema) })
  @ApiResponse({ status: 200, description: 'パスワードリセット成功' })
  @ApiResponse({ status: 400, description: 'トークンが無効または期限切れ' })
  async confirmPasswordReset(
    @Body(new ZodValidationPipe(adminPasswordResetConfirmSchema))
    input: AdminPasswordResetConfirmInput,
  ): Promise<{ message: string }> {
    await this.adminAuthUsecase.confirmPasswordReset(input);
    return { message: 'パスワードをリセットしました' };
  }

  private toResponse(model: AdminModel): AdminAuthResponseDto {
    return {
      id: model.id,
      email: model.email,
      name: model.name,
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const cookieOptions = {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict' as const,
    };

    res.cookie('admin_access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15分
    });

    res.cookie('admin_refresh_token', refreshToken, {
      ...cookieOptions,
      path: '/admin/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7日
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('admin_access_token');
    res.clearCookie('admin_refresh_token', { path: '/admin/auth' });
  }
}
