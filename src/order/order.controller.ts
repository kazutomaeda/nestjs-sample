import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderUsecase } from './order.usecase';
import { OrderModel } from './order.model';
import { OrderResponseDto } from './dto/order-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createOrderSchema,
  CreateOrderInput,
  updateOrderSchema,
  UpdateOrderInput,
  listOrderSchema,
  ListOrderInput,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { JwtPayload } from '../auth/types';

@Controller('orders')
@ApiTags('orders')
@UseGuards(PoliciesGuard)
export class OrderController {
  constructor(
    private readonly orderUsecase: OrderUsecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Order一覧取得（ページネーション対応）',
  })
  @CheckPolicy((ability) => ability.can('read', 'Order'))
  async findAll(
    @Query(new ZodValidationPipe(listOrderSchema)) query: ListOrderInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const { items, totalItems } = await this.orderUsecase.findAll(ability, query);
    return {
      items: items.map((item) => this.toResponse(item)),
      meta: {
        page: query.limit > 0 ? query.page : 1,
        limit: query.limit,
        totalItems,
        totalPages: query.limit > 0 ? Math.ceil(totalItems / query.limit) : 1,
      },
    };
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Order詳細取得',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orderが見つからない' })
  @CheckPolicy((ability) => ability.can('read', 'Order'))
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const order = await this.orderUsecase.findOne(id, ability);
    return this.toResponse(order);
  }

  @Post()
  @ApiBody({ schema: createApiBodySchema(createOrderSchema) })
  @ApiResponse({
    status: 201,
    description: 'Order作成成功',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @CheckPolicy((ability) => ability.can('create', 'Order'))
  async create(
    @Body(new ZodValidationPipe(createOrderSchema)) dto: CreateOrderInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderResponseDto> {
    if (user.tenantId === null) {
      throw new ForbiddenException('テナントに所属していません');
    }
    const order = await this.orderUsecase.create(dto, user.tenantId);
    return this.toResponse(order);
  }

  @Patch(':id')
  @ApiBody({ schema: createApiBodySchema(updateOrderSchema) })
  @ApiResponse({
    status: 200,
    description: 'Order更新成功',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orderが見つからない' })
  @CheckPolicy((ability) => ability.can('update', 'Order'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateOrderSchema)) dto: UpdateOrderInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const order = await this.orderUsecase.update(id, dto, ability);
    return this.toResponse(order);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Order削除成功',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Orderが見つからない' })
  @CheckPolicy((ability) => ability.can('delete', 'Order'))
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const order = await this.orderUsecase.remove(id, ability);
    return this.toResponse(order);
  }

  private toResponse(model: OrderModel): OrderResponseDto {
    return {
      id: model.id,
      title: model.title,
      amount: model.amount,
      paid: model.paid,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
