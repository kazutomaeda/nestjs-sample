import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderModel } from './order.model';

@Injectable()
export class OrderValidator {
  ensureExists(order: OrderModel | null, id: number): OrderModel {
    if (!order) {
      throw new NotFoundException(`Order with id ${id} was not found`);
    }
    return order;
  }
}
