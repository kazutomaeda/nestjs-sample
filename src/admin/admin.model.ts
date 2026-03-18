export class AdminModel {
  readonly id: number;
  readonly email: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: number;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.email = params.email;
    this.name = params.name;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}

export class AdminWithPasswordModel extends AdminModel {
  readonly passwordHash: string;

  constructor(
    params: ConstructorParameters<typeof AdminModel>[0] & {
      passwordHash: string;
    },
  ) {
    super(params);
    this.passwordHash = params.passwordHash;
  }
}
