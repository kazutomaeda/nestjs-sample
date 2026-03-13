export class OrderModel {
  readonly id: number;
  readonly tenantId: number;
  readonly title: string;
  readonly amount: number;
  readonly paid: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: number;
    tenantId: number;
    title: string;
    amount: number;
    paid: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.tenantId = params.tenantId;
    this.title = params.title;
    this.amount = params.amount;
    this.paid = params.paid;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  withUpdate(params: {
    title?: string;
    amount?: number;
    paid?: boolean;
  }): OrderModel {
    return new OrderModel({
      id: this.id,
      tenantId: this.tenantId,
      title: params.title ?? this.title,
      amount: params.amount ?? this.amount,
      paid: params.paid ?? this.paid,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
