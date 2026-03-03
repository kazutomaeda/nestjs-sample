import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { TodoUsecase } from './todo.usecase';
import { TodoModel } from './todo.model';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoResponseDto } from './dto/todo-response.dto';

@Controller('todos')
@ApiTags('todos')
export class TodoController {
  constructor(private readonly todoUsecase: TodoUsecase) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'TODO一覧取得',
    type: [TodoResponseDto],
  })
  async findAll(): Promise<TodoResponseDto[]> {
    const todos = await this.todoUsecase.findAll();
    return todos.map((todo) => this.toResponse(todo));
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'TODO詳細取得',
    type: TodoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'TODOが見つからない' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoUsecase.findOne(id);
    return this.toResponse(todo);
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'TODO作成成功',
    type: TodoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async create(@Body() dto: CreateTodoDto): Promise<TodoResponseDto> {
    const todo = await this.todoUsecase.create(dto);
    return this.toResponse(todo);
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'TODO更新成功',
    type: TodoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'TODOが見つからない' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTodoDto,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoUsecase.update(id, dto);
    return this.toResponse(todo);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'TODO削除成功',
    type: TodoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'TODOが見つからない' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoUsecase.remove(id);
    return this.toResponse(todo);
  }

  private toResponse(model: TodoModel): TodoResponseDto {
    return {
      id: model.id,
      title: model.title,
      completed: model.completed,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
