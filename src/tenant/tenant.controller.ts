import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TenantUsecase } from './tenant.usecase';
import { TenantModel } from './tenant.model';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createTenantSchema,
  CreateTenantInput,
  updateTenantSchema,
  UpdateTenantInput,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { JwtPayload } from '../auth/types';

@Controller('tenants')
@ApiTags('tenants')
@UseGuards(PoliciesGuard)
export class TenantController {
  constructor(
    private readonly tenantUsecase: TenantUsecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'テナント一覧取得',
    type: [TenantResponseDto],
  })
  @CheckPolicy((ability) => ability.can('read', 'Tenant'))
  async findAll(@CurrentUser() user: JwtPayload): Promise<TenantResponseDto[]> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const tenants = await this.tenantUsecase.findAll(ability);
    return tenants.map((tenant) => this.toResponse(tenant));
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'テナント詳細取得',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'テナントが見つからない' })
  @CheckPolicy((ability) => ability.can('read', 'Tenant'))
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<TenantResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const tenant = await this.tenantUsecase.findOne(id, ability);
    return this.toResponse(tenant);
  }

  @Post()
  @ApiBody({ schema: createApiBodySchema(createTenantSchema) })
  @ApiResponse({
    status: 201,
    description: 'テナント作成成功',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @CheckPolicy((ability) => ability.can('create', 'Tenant'))
  async create(@Body(new ZodValidationPipe(createTenantSchema)) dto: CreateTenantInput): Promise<TenantResponseDto> {
    const tenant = await this.tenantUsecase.create(dto);
    return this.toResponse(tenant);
  }

  @Patch(':id')
  @ApiBody({ schema: createApiBodySchema(updateTenantSchema) })
  @ApiResponse({
    status: 200,
    description: 'テナント更新成功',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'テナントが見つからない' })
  @CheckPolicy((ability) => ability.can('update', 'Tenant'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateTenantSchema)) dto: UpdateTenantInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<TenantResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const tenant = await this.tenantUsecase.update(id, dto, ability);
    return this.toResponse(tenant);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'テナント削除成功',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'テナントが見つからない' })
  @CheckPolicy((ability) => ability.can('delete', 'Tenant'))
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<TenantResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const tenant = await this.tenantUsecase.remove(id, ability);
    return this.toResponse(tenant);
  }

  private toResponse(model: TenantModel): TenantResponseDto {
    return {
      id: model.id,
      name: model.name,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
