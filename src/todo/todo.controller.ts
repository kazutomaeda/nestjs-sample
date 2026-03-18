import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParseIdPipe, ResourceId } from '../common/types/id.type';
import { Response } from 'express';
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
  exportTodoSchema,
  ExportTodoInput,
} from './schema';
import {
  CsvExportService,
  ExportColumn,
} from '../common/services/csv-export.service';
import { PdfExportService } from '../common/services/pdf-export.service';
import { createApiBodySchema } from '../common/schema';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { UserJwtPayload } from '../auth/types';

@Controller('todos')
@ApiTags('todos')
@UseGuards(PoliciesGuard)
export class TodoController {
  constructor(
    private readonly todoUsecase: TodoUsecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly csvExportService: CsvExportService,
    private readonly pdfExportService: PdfExportService,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'TODO一覧取得（ページネーション対応）',
  })
  @CheckPolicy((ability) => ability.can('read', 'Todo'))
  async findAll(
    @Query(new ZodValidationPipe(listTodoSchema)) query: ListTodoInput,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<PaginatedResponseDto<TodoResponseDto>> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const { items, totalItems } = await this.todoUsecase.findAll(
      ability,
      query,
    );
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

  @Get('export/csv')
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'TODO一覧CSVエクスポート' })
  @CheckPolicy((ability) => ability.can('read', 'Todo'))
  async exportCsv(
    @Query(new ZodValidationPipe(exportTodoSchema)) query: ExportTodoInput,
    @CurrentUser() user: UserJwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const todos = await this.todoUsecase.findAllForExport(ability, query);
    const buffer = this.csvExportService.generate(this.exportColumns(), todos);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="todos.csv"',
    });
    return new StreamableFile(buffer);
  }

  @Get('export/pdf')
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'TODO一覧PDFエクスポート' })
  @CheckPolicy((ability) => ability.can('read', 'Todo'))
  async exportPdf(
    @Query(new ZodValidationPipe(exportTodoSchema)) query: ExportTodoInput,
    @CurrentUser() user: UserJwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const todos = await this.todoUsecase.findAllForExport(ability, query);
    const buffer = await this.pdfExportService.generate(
      'TODO List',
      this.exportColumns(),
      todos,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="todos.pdf"',
    });
    return new StreamableFile(buffer);
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
    @Param('id', ParseIdPipe) id: ResourceId,
    @CurrentUser() user: UserJwtPayload,
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
    @CurrentUser() user: UserJwtPayload,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoUsecase.create(dto, user.tenantId, user.sub);
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
    @Param('id', ParseIdPipe) id: ResourceId,
    @Body(new ZodValidationPipe(updateTodoSchema)) dto: UpdateTodoInput,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<TodoResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const todo = await this.todoUsecase.update(
      id,
      dto,
      user.tenantId,
      user.sub,
      ability,
    );
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
    @Param('id', ParseIdPipe) id: ResourceId,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<TodoResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const todo = await this.todoUsecase.remove(id, user.sub, ability);
    return this.toResponse(todo);
  }

  private exportColumns(): ExportColumn<TodoModel>[] {
    return [
      { header: 'ID', accessor: (t) => t.id },
      { header: 'タイトル', accessor: (t) => t.title },
      {
        header: '完了',
        accessor: (t) => (t.completed ? '完了' : '未完了'),
      },
      {
        header: 'タグ',
        accessor: (t) => (t.tags ?? []).map((tag) => tag.name).join(', '),
      },
      { header: '作成日時', accessor: (t) => t.createdAt },
      { header: '更新日時', accessor: (t) => t.updatedAt },
    ];
  }

  private toResponse(model: TodoModel): TodoResponseDto {
    return {
      id: model.id,
      tenantId: model.tenantId,
      title: model.title,
      completed: model.completed,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      tags: (model.tags ?? []).map((tag) => ({
        id: tag.id,
        tenantId: tag.tenantId,
        name: tag.name,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      })),
    };
  }
}
