import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductModel } from './product.model';

@Injectable()
export class ProductValidator {
  ensureExists(product: ProductModel | null, id: number): ProductModel {
    if (!product) {
      throw new NotFoundException(`Product with id ${id} was not found`);
    }
    return product;
  }
}
