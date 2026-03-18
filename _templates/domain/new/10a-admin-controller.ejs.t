---
to: src/<%= name %>/admin-<%= name %>.controller.ts
---
<%
const pascal = h.changeCase.pascal(name)
const camel = h.changeCase.camel(name)
const plural = h.inflection.pluralize(name)
const fields = h.parseFields(locals.fields)
const hasFields = fields.length > 0
-%>
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseIdPipe, ResourceId } from '../common/types/id.type';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin<%= pascal %>Usecase } from './admin-<%= name %>.usecase';
import { <%= pascal %>Model } from './<%= name %>.model';
import { <%= pascal %>ResponseDto } from './dto/<%= name %>-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  adminCreate<%= pascal %>Schema,
  AdminCreate<%= pascal %>Input,
  update<%= pascal %>Schema,
  Update<%= pascal %>Input,
  list<%= pascal %>Schema,
  List<%= pascal %>Input,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { JwtPayload } from '../auth/types';

@Controller('admin/<%= plural %>')
@ApiTags('admin/<%= plural %>')
@UseGuards(PoliciesGuard)
export class Admin<%= pascal %>Controller {
  constructor(
    private readonly admin<%= pascal %>Usecase: Admin<%= pascal %>Usecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: '<%= pascal %>一覧取得（管理者・ページネーション対応）',
  })
  @CheckPolicy((ability) => ability.can('read', '<%= pascal %>'))
  async findAll(
    @Query(new ZodValidationPipe(list<%= pascal %>Schema)) query: List<%= pascal %>Input,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<<%= pascal %>ResponseDto>> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const { items, totalItems } = await this.admin<%= pascal %>Usecase.findAll(ability, query);
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
    description: '<%= pascal %>詳細取得（管理者）',
    type: <%= pascal %>ResponseDto,
  })
  @ApiResponse({ status: 404, description: '<%= pascal %>が見つからない' })
  @CheckPolicy((ability) => ability.can('read', '<%= pascal %>'))
  async findOne(
    @Param('id', ParseIdPipe) id: ResourceId,
    @CurrentUser() user: JwtPayload,
  ): Promise<<%= pascal %>ResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const <%= camel %> = await this.admin<%= pascal %>Usecase.findOne(id, ability);
    return this.toResponse(<%= camel %>);
  }

  @Post()
  @ApiBody({ schema: createApiBodySchema(adminCreate<%= pascal %>Schema) })
  @ApiResponse({
    status: 201,
    description: '<%= pascal %>作成成功（管理者）',
    type: <%= pascal %>ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @CheckPolicy((ability) => ability.can('create', '<%= pascal %>'))
  async create(
    @Body(new ZodValidationPipe(adminCreate<%= pascal %>Schema)) dto: AdminCreate<%= pascal %>Input,
    @CurrentUser() user: JwtPayload,
  ): Promise<<%= pascal %>ResponseDto> {
    const <%= camel %> = await this.admin<%= pascal %>Usecase.create(dto, user.sub);
    return this.toResponse(<%= camel %>);
  }

  @Patch(':id')
  @ApiBody({ schema: createApiBodySchema(update<%= pascal %>Schema) })
  @ApiResponse({
    status: 200,
    description: '<%= pascal %>更新成功（管理者）',
    type: <%= pascal %>ResponseDto,
  })
  @ApiResponse({ status: 404, description: '<%= pascal %>が見つからない' })
  @CheckPolicy((ability) => ability.can('update', '<%= pascal %>'))
  async update(
    @Param('id', ParseIdPipe) id: ResourceId,
    @Body(new ZodValidationPipe(update<%= pascal %>Schema)) dto: Update<%= pascal %>Input,
    @CurrentUser() user: JwtPayload,
  ): Promise<<%= pascal %>ResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const <%= camel %> = await this.admin<%= pascal %>Usecase.update(id, dto, user.sub, ability);
    return this.toResponse(<%= camel %>);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: '<%= pascal %>削除成功（管理者）',
    type: <%= pascal %>ResponseDto,
  })
  @ApiResponse({ status: 404, description: '<%= pascal %>が見つからない' })
  @CheckPolicy((ability) => ability.can('delete', '<%= pascal %>'))
  async remove(
    @Param('id', ParseIdPipe) id: ResourceId,
    @CurrentUser() user: JwtPayload,
  ): Promise<<%= pascal %>ResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const <%= camel %> = await this.admin<%= pascal %>Usecase.remove(id, user.sub, ability);
    return this.toResponse(<%= camel %>);
  }

<% if (hasFields) { -%>
  private toResponse(model: <%= pascal %>Model): <%= pascal %>ResponseDto {
    return {
      id: model.id,
<% fields.forEach(f => { -%>
      <%= f.name %>: model.<%= f.name %>,
<% }) -%>
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
<% } else { -%>
  // TODO: ドメインに合わせてフィールドを追加
  private toResponse(model: <%= pascal %>Model): <%= pascal %>ResponseDto {
    return {
      id: model.id,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
<% } -%>
}
