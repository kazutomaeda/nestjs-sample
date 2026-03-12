import {
  BadRequestException,
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
import { UserUsecase } from './user.usecase';
import { UserModel } from './user.model';
import { UserResponseDto } from './dto/user-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createUserSchema,
  CreateUserInput,
  updateUserSchema,
  UpdateUserInput,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { JwtPayload } from '../auth/types';

@Controller('users')
@ApiTags('users')
@UseGuards(PoliciesGuard)
export class UserController {
  constructor(
    private readonly userUsecase: UserUsecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'ユーザー一覧取得',
    type: [UserResponseDto],
  })
  @CheckPolicy((ability) => ability.can('read', 'User'))
  async findAll(@CurrentUser() user: JwtPayload): Promise<UserResponseDto[]> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const users = await this.userUsecase.findAll(ability);
    return users.map((u) => this.toResponse(u));
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'ユーザー詳細取得',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ユーザーが見つからない' })
  @CheckPolicy((ability) => ability.can('read', 'User'))
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const found = await this.userUsecase.findOne(id, ability);
    return this.toResponse(found);
  }

  @Post()
  @ApiBody({ schema: createApiBodySchema(createUserSchema) })
  @ApiResponse({
    status: 201,
    description: 'ユーザー作成成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @CheckPolicy((ability) => ability.can('create', 'User'))
  async create(
    @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    const tenantId = dto.tenantId ?? user.tenantId;
    if (tenantId === null) {
      throw new BadRequestException('テナントIDが指定されていません');
    }
    const created = await this.userUsecase.create(dto, tenantId);
    return this.toResponse(created);
  }

  @Patch(':id')
  @ApiBody({ schema: createApiBodySchema(updateUserSchema) })
  @ApiResponse({
    status: 200,
    description: 'ユーザー更新成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ユーザーが見つからない' })
  @CheckPolicy((ability) => ability.can('update', 'User'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const updated = await this.userUsecase.update(id, dto, ability);
    return this.toResponse(updated);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'ユーザー削除成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ユーザーが見つからない' })
  @CheckPolicy((ability) => ability.can('delete', 'User'))
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const removed = await this.userUsecase.remove(id, user.sub, ability);
    return this.toResponse(removed);
  }

  private toResponse(model: UserModel): UserResponseDto {
    return {
      id: model.id,
      tenantId: model.tenantId,
      role: model.role,
      email: model.email,
      name: model.name,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
