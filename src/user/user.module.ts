import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserController } from './user.controller';
import { UserRepository } from './external/user.repository';
import { UserUsecase } from './user.usecase';
import { UserValidator } from './user.validator';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserUsecase, UserValidator, UserRepository],
  exports: [UserRepository],
})
export class UserModule {}
