import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';
import { AdminAuthController } from './admin/admin-auth.controller';
import { AdminAuthUsecase } from './admin/admin-auth.usecase';
import { AdminAuthValidator } from './admin/admin-auth.validator';
import { AdminAuthRepository } from './admin/admin-auth.repository';
import { UserAuthController } from './user/user-auth.controller';
import { UserAuthUsecase } from './user/user-auth.usecase';
import { UserAuthValidator } from './user/user-auth.validator';
import { UserAuthRepository } from './user/user-auth.repository';
import { CaslAbilityFactory } from './external/casl-ability.factory';
import { AdminAuthGuard } from './external/admin-auth.guard';
import { UserAuthGuard } from './external/user-auth.guard';
import { CompositeAuthGuard } from './external/composite-auth.guard';
import { PoliciesGuard } from './external/policies.guard';

@Module({
  imports: [
    MailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            configService.get<number>('JWT_ACCESS_TOKEN_EXPIRES_IN') ?? 900,
        },
      }),
    }),
  ],
  controllers: [AdminAuthController, UserAuthController],
  providers: [
    AdminAuthUsecase,
    AdminAuthValidator,
    AdminAuthRepository,
    UserAuthUsecase,
    UserAuthValidator,
    UserAuthRepository,
    CaslAbilityFactory,
    AdminAuthGuard,
    UserAuthGuard,
    CompositeAuthGuard,
    PoliciesGuard,
  ],
  exports: [
    CaslAbilityFactory,
    AdminAuthGuard,
    UserAuthGuard,
    CompositeAuthGuard,
    PoliciesGuard,
  ],
})
export class AuthModule {}
