import { TagModel } from '../tag/tag.model';

export class TodoModel {
  readonly id: number;
  readonly tenantId: number;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly tags?: TagModel[];

  constructor(params: {
    id: number;
    tenantId: number;
    title: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
    tags?: TagModel[];
  }) {
    this.id = params.id;
    this.tenantId = params.tenantId;
    this.title = params.title;
    this.completed = params.completed;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    this.tags = params.tags;
  }

  withUpdate(title?: string, completed?: boolean): TodoModel {
    return new TodoModel({
      id: this.id,
      tenantId: this.tenantId,
      title: title ?? this.title,
      completed: completed ?? this.completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tags: this.tags,
    });
  }
}
