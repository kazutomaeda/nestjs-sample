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
import { ProductUsecase } from './product.usecase';
import { ProductModel } from './product.model';
import { ProductResponseDto } from './dto/product-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createProductSchema,
  CreateProductInput,
  updateProductSchema,
  UpdateProductInput,
  listProductSchema,
  ListProductInput,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { JwtPayload } from '../auth/types';

@Controller('products')
@ApiTags('products')
@UseGuards(PoliciesGuard)
export class ProductController {
  constructor(
    private readonly productUsecase: ProductUsecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Product一覧取得（ページネーション対応）',
  })
  @CheckPolicy((ability) => ability.can('read', 'Product'))
  async findAll(
    @Query(new ZodValidationPipe(listProductSchema)) query: ListProductInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const { items, totalItems } = await this.productUsecase.findAll(ability, query);
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
    description: 'Product詳細取得',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Productが見つからない' })
  @CheckPolicy((ability) => ability.can('read', 'Product'))
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const product = await this.productUsecase.findOne(id, ability);
    return this.toResponse(product);
  }

  @Post()
  @ApiBody({ schema: createApiBodySchema(createProductSchema) })
  @ApiResponse({
    status: 201,
    description: 'Product作成成功',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @CheckPolicy((ability) => ability.can('create', 'Product'))
  async create(
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    if (user.tenantId === null) {
      throw new ForbiddenException('テナントに所属していません');
    }
    const product = await this.productUsecase.create(dto, user.tenantId, );
    return this.toResponse(product);
  }

  @Patch(':id')
  @ApiBody({ schema: createApiBodySchema(updateProductSchema) })
  @ApiResponse({
    status: 200,
    description: 'Product更新成功',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Productが見つからない' })
  @CheckPolicy((ability) => ability.can('update', 'Product'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateProductSchema)) dto: UpdateProductInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const product = await this.productUsecase.update(id, dto, ability);
    return this.toResponse(product);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Product削除成功',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Productが見つからない' })
  @CheckPolicy((ability) => ability.can('delete', 'Product'))
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const product = await this.productUsecase.remove(id, ability);
    return this.toResponse(product);
  }

  // TODO: ドメインに合わせてフィールドを追加
  private toResponse(model: ProductModel): ProductResponseDto {
    return {
      id: model.id,
      name: model.name,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
