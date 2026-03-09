export class TagModel {
  readonly id: number;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  withUpdate(name?: string): TagModel {
    return new TagModel({
      id: this.id,
      name: name ?? this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
