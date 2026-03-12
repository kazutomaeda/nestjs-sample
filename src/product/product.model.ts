export class ProductModel {
  readonly id: number;
  readonly tenantId: number;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: number;
    tenantId: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.tenantId = params.tenantId;
    this.name = params.name;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  // TODO: ドメインに合わせてフィールドと withUpdate を追加
  withUpdate(): ProductModel {
    return new ProductModel({
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
