import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthUsecase } from './auth.usecase';
import { AuthValidator } from './auth.validator';
import { AuthRepository } from './auth.repository';
import { CaslAbilityFactory } from './external/casl-ability.factory';
import { JwtAuthGuard } from './external/jwt-auth.guard';
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
  controllers: [AuthController],
  providers: [
    AuthUsecase,
    AuthValidator,
    AuthRepository,
    CaslAbilityFactory,
    JwtAuthGuard,
    PoliciesGuard,
  ],
  exports: [CaslAbilityFactory, JwtAuthGuard, PoliciesGuard],
})
export class AuthModule {}
