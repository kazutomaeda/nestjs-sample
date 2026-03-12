import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProductController } from './product.controller';
import { ProductRepository } from './product.repository';
import { ProductUsecase } from './product.usecase';
import { ProductValidator } from './product.validator';

@Module({
  imports: [AuthModule],
  controllers: [ProductController],
  providers: [ProductUsecase, ProductValidator, ProductRepository],
  // exports は external/ 配下のもののみ
})
export class ProductModule {}
