import { Tag } from '../tag/tag.entity';

export class TodoTag {
  todoId: number;
  tagId: number;
  tag: Tag;
}

export class Todo {
  id: number;
  tenantId: number;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  todoTags?: TodoTag[];
}
