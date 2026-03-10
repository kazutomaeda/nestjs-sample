import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import {
  CHECK_POLICY_KEY,
  PolicyHandler,
} from '../decorators/check-policy.decorator';
import { JwtPayload } from '../types';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policyHandler = this.reflector.get<PolicyHandler>(
      CHECK_POLICY_KEY,
      context.getHandler(),
    );

    if (!policyHandler) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      return false;
    }

    const ability = this.caslAbilityFactory.createForUser(user);
    return policyHandler(ability);
  }
}
