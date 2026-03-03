export class TodoModel {
  readonly id: number;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: number;
    title: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.title = params.title;
    this.completed = params.completed;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  withUpdate(title?: string, completed?: boolean): TodoModel {
    return new TodoModel({
      id: this.id,
      title: title ?? this.title,
      completed: completed ?? this.completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
