import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FileController } from './file.controller';
import { FileUsecase } from './file.usecase';
import { FileValidator } from './file.validator';
import { FileRepository } from './file.repository';
import { FileStorageClient } from './external/file-storage.client';
import { S3StorageClient } from './external/s3-storage.client';

@Module({
  imports: [AuthModule],
  controllers: [FileController],
  providers: [
    FileUsecase,
    FileValidator,
    FileRepository,
    { provide: FileStorageClient, useClass: S3StorageClient },
  ],
  // exports は external/ 配下のもののみ
})
export class FileModule {}
