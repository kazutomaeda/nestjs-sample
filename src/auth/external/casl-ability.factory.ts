import { Injectable } from '@nestjs/common';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import {
  Todo,
  Tag,
  User,
  Tenant,
  // HYGEN:CASL-IMPORT
} from '@prisma/client';
import { JwtPayload } from '../types';

type AppSubjects =
  | Subjects<{
      Todo: Todo;
      Tag: Tag;
      User: User;
      Tenant: Tenant;
      // HYGEN:CASL-SUBJECT
    }>
  | 'all';

export type AppAbility = PureAbility<[string, AppSubjects], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: JwtPayload): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    switch (user.role) {
      case 'system_admin':
        can('manage', 'all');
        break;

      case 'tenant_admin':
        if (user.tenantId !== null) {
          can('manage', 'Todo', { tenantId: user.tenantId });
          can('manage', 'Tag', { tenantId: user.tenantId });
          // HYGEN:CASL-ADMIN
          can('read', 'User', { tenantId: user.tenantId });
          can('manage', 'User', { tenantId: user.tenantId });
          can('read', 'Tenant', { id: user.tenantId });
          can('update', 'Tenant', { id: user.tenantId });
        }
        break;

      case 'tenant_user':
        if (user.tenantId !== null) {
          can('read', 'Todo', { tenantId: user.tenantId });
          can('create', 'Todo', { tenantId: user.tenantId });
          can('update', 'Todo', { tenantId: user.tenantId });
          can('read', 'Tag', { tenantId: user.tenantId });
          // HYGEN:CASL-USER
          can('read', 'User', { id: user.sub });
          can('update', 'User', { id: user.sub });
        }
        break;
    }

    return build();
  }
}
