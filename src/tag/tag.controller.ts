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
import { TagUsecase } from './tag.usecase';
import { TagModel } from './tag.model';
import { TagResponseDto } from './dto/tag-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createTagSchema,
  CreateTagInput,
  updateTagSchema,
  UpdateTagInput,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CaslAbilityFactory,
  AppAbility,
} from '../auth/external/casl-ability.factory';
import { UserJwtPayload } from '../auth/types';

@Controller('tags')
@ApiTags('tags')
@UseGuards(PoliciesGuard)
export class TagController {
  constructor(
    private readonly tagUsecase: TagUsecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  private getAbility(user: UserJwtPayload): AppAbility {
    return this.caslAbilityFactory.createForUser(user);
  }

  @Get()
  @CheckPolicy((ability) => ability.can('read', 'Tag'))
  @ApiResponse({
    status: 200,
    description: 'タグ一覧取得',
    type: [TagResponseDto],
  })
  async findAll(
    @CurrentUser() user: UserJwtPayload,
  ): Promise<TagResponseDto[]> {
    const ability = this.getAbility(user);
    const tags = await this.tagUsecase.findAll(ability);
    return tags.map((tag) => this.toResponse(tag));
  }

  @Get(':id')
  @CheckPolicy((ability) => ability.can('read', 'Tag'))
  @ApiResponse({
    status: 200,
    description: 'タグ詳細取得',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'タグが見つからない' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<TagResponseDto> {
    const ability = this.getAbility(user);
    const tag = await this.tagUsecase.findOne(id, ability);
    return this.toResponse(tag);
  }

  @Post()
  @CheckPolicy((ability) => ability.can('create', 'Tag'))
  @ApiBody({ schema: createApiBodySchema(createTagSchema) })
  @ApiResponse({
    status: 201,
    description: 'タグ作成成功',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 409, description: 'タグ名が重複' })
  async create(
    @Body(new ZodValidationPipe(createTagSchema)) dto: CreateTagInput,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<TagResponseDto> {
    const tag = await this.tagUsecase.create(dto, user.tenantId!);
    return this.toResponse(tag);
  }

  @Patch(':id')
  @CheckPolicy((ability) => ability.can('update', 'Tag'))
  @ApiBody({ schema: createApiBodySchema(updateTagSchema) })
  @ApiResponse({
    status: 200,
    description: 'タグ更新成功',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'タグが見つからない' })
  @ApiResponse({ status: 409, description: 'タグ名が重複' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateTagSchema)) dto: UpdateTagInput,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<TagResponseDto> {
    const ability = this.getAbility(user);
    const tag = await this.tagUsecase.update(id, dto, user.tenantId!, ability);
    return this.toResponse(tag);
  }

  @Delete(':id')
  @CheckPolicy((ability) => ability.can('delete', 'Tag'))
  @ApiResponse({
    status: 200,
    description: 'タグ削除成功',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'タグが見つからない' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<TagResponseDto> {
    const ability = this.getAbility(user);
    const tag = await this.tagUsecase.remove(id, ability);
    return this.toResponse(tag);
  }

  private toResponse(model: TagModel): TagResponseDto {
    return {
      id: model.id,
      name: model.name,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
