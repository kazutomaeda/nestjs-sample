import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionService } from '../prisma/transaction.service';
import { FileStorageClient } from './external/file-storage.client';
import { FileRepository } from './file.repository';
import { FileModel } from './file.model';
import { FileValidator } from './file.validator';
import { UploadFileInput, CopyFileInput } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';

@Injectable()
export class FileUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: FileRepository,
    private readonly validator: FileValidator,
    private readonly storage: FileStorageClient,
  ) {}

  async findOne(id: number, ability: AppAbility): Promise<FileModel> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }

  async upload(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    input: UploadFileInput,
    tenantId: number,
  ): Promise<FileModel> {
    const ext = file.originalname.includes('.')
      ? '.' + file.originalname.split('.').pop()
      : '';
    const key = `${tenantId}/${randomUUID()}${ext}`;

    await this.storage.upload(key, file.buffer, file.mimetype);

    return this.transaction.run(async (tx) => {
      return this.repository.create(
        {
          tenantId,
          key,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          relatedTable: input.relatedTable,
          relatedId: input.relatedId,
        },
        tx,
      );
    });
  }

  async copy(
    id: number,
    input: CopyFileInput,
    tenantId: number,
    ability: AppAbility,
  ): Promise<FileModel> {
    const source = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );

    const ext = source.originalName.includes('.')
      ? '.' + source.originalName.split('.').pop()
      : '';
    const destKey = `${tenantId}/${randomUUID()}${ext}`;

    await this.storage.copy(source.key, destKey);

    return this.transaction.run(async (tx) => {
      return this.repository.create(
        {
          tenantId,
          key: destKey,
          originalName: source.originalName,
          mimeType: source.mimeType,
          size: source.size,
          relatedTable: input.relatedTable,
          relatedId: input.relatedId,
        },
        tx,
      );
    });
  }

  async remove(id: number, ability: AppAbility): Promise<FileModel> {
    const file = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );

    await this.storage.delete(file.key);

    return this.transaction.run((tx) => {
      return this.repository.delete(id, tx);
    });
  }

  async getSignedUrl(key: string): Promise<string> {
    return this.storage.getSignedUrl(key);
  }
}
