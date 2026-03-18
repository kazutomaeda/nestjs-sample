import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserJwtPayload } from '../types';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.['user_access_token'];

    if (!token) {
      throw new UnauthorizedException('認証が必要です');
    }

    try {
      const payload: UserJwtPayload = await this.jwtService.verifyAsync(token);
      if (payload.type !== 'user') {
        throw new UnauthorizedException('ユーザートークンではありません');
      }
      request.user = payload;
    } catch {
      throw new UnauthorizedException('トークンが無効です');
    }

    return true;
  }
}
