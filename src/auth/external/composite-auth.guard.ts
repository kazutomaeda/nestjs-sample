import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthGuard } from './admin-auth.guard';
import { UserAuthGuard } from './user-auth.guard';

@Injectable()
export class CompositeAuthGuard implements CanActivate {
  constructor(
    private readonly adminAuthGuard: AdminAuthGuard,
    private readonly userAuthGuard: UserAuthGuard,
  ) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.path.startsWith('/admin/')) {
      return this.adminAuthGuard.canActivate(context) as Promise<boolean>;
    }

    return this.userAuthGuard.canActivate(context) as Promise<boolean>;
  }
}
