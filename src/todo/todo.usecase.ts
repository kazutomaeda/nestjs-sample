import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TodoRepository } from '../repository/todo.repository';
import { TodoModel } from './todo.model';
import { TodoValidator } from './todo.validator';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoUsecase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: TodoRepository,
    private readonly validator: TodoValidator,
  ) {}

  async findAll(): Promise<TodoModel[]> {
    return this.repository.findAll();
  }

  async findOne(id: number): Promise<TodoModel> {
    return this.validator.ensureExists(await this.repository.findById(id), id);
  }

  async create(dto: CreateTodoDto): Promise<TodoModel> {
    return this.prisma.$transaction((tx) => {
      return this.repository.create({ title: dto.title }, tx);
    });
  }

  async update(id: number, dto: UpdateTodoDto): Promise<TodoModel> {
    const todo = this.validator.ensureExists(
      await this.repository.findById(id),
      id,
    );

    const updated = todo.withUpdate(dto.title, dto.completed);

    return this.prisma.$transaction((tx) => {
      return this.repository.update(id, updated, tx);
    });
  }

  async remove(id: number): Promise<TodoModel> {
    this.validator.ensureExists(await this.repository.findById(id), id);
    return this.prisma.$transaction((tx) => {
      return this.repository.delete(id, tx);
    });
  }
}
