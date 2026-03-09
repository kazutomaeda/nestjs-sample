import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TagModel } from './tag.model';

@Injectable()
export class TagValidator {
  ensureExists(tag: TagModel | null, id: number): TagModel {
    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} was not found`);
    }
    return tag;
  }

  ensureNameNotDuplicated(existing: TagModel | null, name: string): void {
    if (existing) {
      throw new ConflictException(`Tag with name '${name}' already exists`);
    }
  }
}
