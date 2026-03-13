---
to: src/<%= name %>/<%= name %>.controller.ts
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
import { <%= pascal %>Usecase } from './<%= name %>.usecase';
import { <%= pascal %>Model } from './<%= name %>.model';
import { <%= pascal %>ResponseDto } from './dto/<%= name %>-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  create<%= pascal %>Schema,
  Create<%= pascal %>Input,
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

@Controller('<%= plural %>')
@ApiTags('<%= plural %>')
@UseGuards(PoliciesGuard)
export class <%= pascal %>Controller {
  constructor(
    private readonly <%= camel %>Usecase: <%= pascal %>Usecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: '<%= pascal %>一覧取得（ページネーション対応）',
  })
  @CheckPolicy((ability) => ability.can('read', '<%= pascal %>'))
  async findAll(
    @Query(new ZodValidationPipe(list<%= pascal %>Schema)) query: List<%= pascal %>Input,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<<%= pascal %>ResponseDto>> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const { items, totalItems } = await this.<%= camel %>Usecase.findAll(ability, query);
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
    description: '<%= pascal %>詳細取得',
    type: <%= pascal %>ResponseDto,
  })
  @ApiResponse({ status: 404, description: '<%= pascal %>が見つからない' })
  @CheckPolicy((ability) => ability.can('read', '<%= pascal %>'))
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<<%= pascal %>ResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const <%= camel %> = await this.<%= camel %>Usecase.findOne(id, ability);
    return this.toResponse(<%= camel %>);
  }

  @Post()
  @ApiBody({ schema: createApiBodySchema(create<%= pascal %>Schema) })
  @ApiResponse({
    status: 201,
    description: '<%= pascal %>作成成功',
    type: <%= pascal %>ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @CheckPolicy((ability) => ability.can('create', '<%= pascal %>'))
  async create(
    @Body(new ZodValidationPipe(create<%= pascal %>Schema)) dto: Create<%= pascal %>Input,
    @CurrentUser() user: JwtPayload,
  ): Promise<<%= pascal %>ResponseDto> {
    if (user.tenantId === null) {
      throw new ForbiddenException('テナントに所属していません');
    }
    const <%= camel %> = await this.<%= camel %>Usecase.create(dto, user.tenantId);
    return this.toResponse(<%= camel %>);
  }

  @Patch(':id')
  @ApiBody({ schema: createApiBodySchema(update<%= pascal %>Schema) })
  @ApiResponse({
    status: 200,
    description: '<%= pascal %>更新成功',
    type: <%= pascal %>ResponseDto,
  })
  @ApiResponse({ status: 404, description: '<%= pascal %>が見つからない' })
  @CheckPolicy((ability) => ability.can('update', '<%= pascal %>'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(update<%= pascal %>Schema)) dto: Update<%= pascal %>Input,
    @CurrentUser() user: JwtPayload,
  ): Promise<<%= pascal %>ResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const <%= camel %> = await this.<%= camel %>Usecase.update(id, dto, ability);
    return this.toResponse(<%= camel %>);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: '<%= pascal %>削除成功',
    type: <%= pascal %>ResponseDto,
  })
  @ApiResponse({ status: 404, description: '<%= pascal %>が見つからない' })
  @CheckPolicy((ability) => ability.can('delete', '<%= pascal %>'))
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<<%= pascal %>ResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const <%= camel %> = await this.<%= camel %>Usecase.remove(id, ability);
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
