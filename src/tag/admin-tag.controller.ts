import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParseIdPipe, ResourceId } from '../common/types/id.type';
import { AdminTagUsecase } from './admin-tag.usecase';
import { TagModel } from './tag.model';
import { TagResponseDto } from './dto/tag-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  adminCreateTagSchema,
  AdminCreateTagInput,
  updateTagSchema,
  UpdateTagInput,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { JwtPayload } from '../auth/types';

@Controller('admin/tags')
@ApiTags('admin/tags')
@UseGuards(PoliciesGuard)
export class AdminTagController {
  constructor(
    private readonly adminTagUsecase: AdminTagUsecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'タグ一覧取得（管理者）',
    type: [TagResponseDto],
  })
  @CheckPolicy((ability) => ability.can('read', 'Tag'))
  async findAll(@CurrentUser() user: JwtPayload): Promise<TagResponseDto[]> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const tags = await this.adminTagUsecase.findAll(ability);
    return tags.map((tag) => this.toResponse(tag));
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'タグ詳細取得（管理者）',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'タグが見つからない' })
  @CheckPolicy((ability) => ability.can('read', 'Tag'))
  async findOne(
    @Param('id', ParseIdPipe) id: ResourceId,
    @CurrentUser() user: JwtPayload,
  ): Promise<TagResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const tag = await this.adminTagUsecase.findOne(id, ability);
    return this.toResponse(tag);
  }

  @Post()
  @ApiBody({ schema: createApiBodySchema(adminCreateTagSchema) })
  @ApiResponse({
    status: 201,
    description: 'タグ作成成功（管理者）',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 409, description: 'タグ名が重複' })
  @CheckPolicy((ability) => ability.can('create', 'Tag'))
  async create(
    @Body(new ZodValidationPipe(adminCreateTagSchema)) dto: AdminCreateTagInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<TagResponseDto> {
    const tag = await this.adminTagUsecase.create(dto, user.sub);
    return this.toResponse(tag);
  }

  @Patch(':id')
  @ApiBody({ schema: createApiBodySchema(updateTagSchema) })
  @ApiResponse({
    status: 200,
    description: 'タグ更新成功（管理者）',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'タグが見つからない' })
  @ApiResponse({ status: 409, description: 'タグ名が重複' })
  @CheckPolicy((ability) => ability.can('update', 'Tag'))
  async update(
    @Param('id', ParseIdPipe) id: ResourceId,
    @Body(new ZodValidationPipe(updateTagSchema)) dto: UpdateTagInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<TagResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const tag = await this.adminTagUsecase.update(id, dto, user.sub, ability);
    return this.toResponse(tag);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'タグ削除成功（管理者）',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'タグが見つからない' })
  @CheckPolicy((ability) => ability.can('delete', 'Tag'))
  async remove(
    @Param('id', ParseIdPipe) id: ResourceId,
    @CurrentUser() user: JwtPayload,
  ): Promise<TagResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const tag = await this.adminTagUsecase.remove(id, user.sub, ability);
    return this.toResponse(tag);
  }

  private toResponse(model: TagModel): TagResponseDto {
    return {
      id: model.id,
      tenantId: model.tenantId,
      name: model.name,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
