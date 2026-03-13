import { Injectable, NotFoundException } from '@nestjs/common';
import { FileModel } from './file.model';

@Injectable()
export class FileValidator {
  ensureExists(file: FileModel | null, id: number): FileModel {
    if (!file) {
      throw new NotFoundException(`File with id ${id} was not found`);
    }
    return file;
  }
}
