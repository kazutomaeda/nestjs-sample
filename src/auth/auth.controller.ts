import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthUsecase } from './auth.usecase';
import { UserModel } from './auth.model';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  loginSchema,
  LoginInput,
  passwordResetRequestSchema,
  PasswordResetRequestInput,
  passwordResetConfirmSchema,
  PasswordResetConfirmInput,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './types';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly authUsecase: AuthUsecase,
    private readonly configService: ConfigService,
  ) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: createApiBodySchema(loginSchema) })
  @ApiResponse({ status: 200, description: 'ログイン成功', type: AuthUserResponseDto })
  @ApiResponse({ status: 401, description: '認証失敗' })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() input: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUserResponseDto> {
    const { user, tokens } = await this.authUsecase.login(input);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return this.toResponse(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'ログアウト成功' })
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = res.req.cookies?.['refresh_token'];
    if (refreshToken) {
      await this.authUsecase.logout(refreshToken);
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
    const refreshToken = res.req.cookies?.['refresh_token'];
    if (!refreshToken) {
      this.clearAuthCookies(res);
      throw new Error('リフレッシュトークンがありません');
    }

    const tokens = await this.authUsecase.refresh(refreshToken);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return { message: 'トークンをリフレッシュしました' };
  }

  @Get('me')
  @ApiResponse({ status: 200, description: 'ユーザー情報取得成功', type: AuthUserResponseDto })
  @ApiResponse({ status: 401, description: '認証が必要' })
  async getMe(@CurrentUser() user: JwtPayload): Promise<AuthUserResponseDto> {
    const userModel = await this.authUsecase.getMe(user.sub);
    return this.toResponse(userModel);
  }

  @Post('password-reset/request')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: createApiBodySchema(passwordResetRequestSchema) })
  @ApiResponse({ status: 200, description: 'パスワードリセットメール送信（ユーザーが存在しない場合も成功を返す）' })
  @UsePipes(new ZodValidationPipe(passwordResetRequestSchema))
  async requestPasswordReset(
    @Body() input: PasswordResetRequestInput,
  ): Promise<{ message: string }> {
    await this.authUsecase.requestPasswordReset(input);
    return { message: 'パスワードリセットメールを送信しました' };
  }

  @Post('password-reset/confirm')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: createApiBodySchema(passwordResetConfirmSchema) })
  @ApiResponse({ status: 200, description: 'パスワードリセット成功' })
  @ApiResponse({ status: 400, description: 'トークンが無効または期限切れ' })
  @UsePipes(new ZodValidationPipe(passwordResetConfirmSchema))
  async confirmPasswordReset(
    @Body() input: PasswordResetConfirmInput,
  ): Promise<{ message: string }> {
    await this.authUsecase.confirmPasswordReset(input);
    return { message: 'パスワードをリセットしました' };
  }

  private toResponse(model: UserModel): AuthUserResponseDto {
    return {
      id: model.id,
      tenantId: model.tenantId,
      role: model.role,
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

    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15分
    });

    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7日
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/auth' });
  }
}
