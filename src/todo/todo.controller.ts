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
import { TodoUsecase } from './todo.usecase';
import { TodoModel } from './todo.model';
import { TodoResponseDto } from './dto/todo-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createTodoSchema,
  CreateTodoInput,
  updateTodoSchema,
  UpdateTodoInput,
  listTodoSchema,
  ListTodoInput,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { JwtPayload } from '../auth/types';

@Controller('todos')
@ApiTags('todos')
@UseGuards(PoliciesGuard)
export class TodoController {
  constructor(
    private readonly todoUsecase: TodoUsecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'TODO一覧取得（ページネーション対応）',
  })
  @CheckPolicy((ability) => ability.can('read', 'Todo'))
  async findAll(
    @Query(new ZodValidationPipe(listTodoSchema)) query: ListTodoInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<TodoResponseDto>> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const { items, totalItems } = await this.todoUsecase.findAll(ability, query);
    return {
      items: items.map((todo) => this.toResponse(todo)),
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
    description: 'TODO詳細取得',
    type: TodoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'TODOが見つからない' })
  @CheckPolicy((ability) => ability.can('read', 'Todo'))
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<TodoResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const todo = await this.todoUsecase.findOne(id, ability);
    return this.toResponse(todo);
  }

  @Post()
  @ApiBody({ schema: createApiBodySchema(createTodoSchema) })
  @ApiResponse({
    status: 201,
    description: 'TODO作成成功',
    type: TodoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @CheckPolicy((ability) => ability.can('create', 'Todo'))
  async create(
    @Body(new ZodValidationPipe(createTodoSchema)) dto: CreateTodoInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<TodoResponseDto> {
    if (user.tenantId === null) {
      throw new ForbiddenException('テナントに所属していません');
    }
    const ability = this.caslAbilityFactory.createForUser(user);
    const todo = await this.todoUsecase.create(dto, user.tenantId, ability);
    return this.toResponse(todo);
  }

  @Patch(':id')
  @ApiBody({ schema: createApiBodySchema(updateTodoSchema) })
  @ApiResponse({
    status: 200,
    description: 'TODO更新成功',
    type: TodoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'TODOが見つからない' })
  @CheckPolicy((ability) => ability.can('update', 'Todo'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateTodoSchema)) dto: UpdateTodoInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<TodoResponseDto> {
    if (user.tenantId === null) {
      throw new ForbiddenException('テナントに所属していません');
    }
    const ability = this.caslAbilityFactory.createForUser(user);
    const todo = await this.todoUsecase.update(id, dto, user.tenantId, ability);
    return this.toResponse(todo);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'TODO削除成功',
    type: TodoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'TODOが見つからない' })
  @CheckPolicy((ability) => ability.can('delete', 'Todo'))
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<TodoResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const todo = await this.todoUsecase.remove(id, ability);
    return this.toResponse(todo);
  }

  private toResponse(model: TodoModel): TodoResponseDto {
    return {
      id: model.id,
      title: model.title,
      completed: model.completed,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      tags: (model.tags ?? []).map((tag) => ({
        id: tag.id,
        name: tag.name,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      })),
    };
  }
}
