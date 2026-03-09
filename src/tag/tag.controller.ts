import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
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

@Controller('tags')
@ApiTags('tags')
export class TagController {
  constructor(private readonly tagUsecase: TagUsecase) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'タグ一覧取得',
    type: [TagResponseDto],
  })
  async findAll(): Promise<TagResponseDto[]> {
    const tags = await this.tagUsecase.findAll();
    return tags.map((tag) => this.toResponse(tag));
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'タグ詳細取得',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'タグが見つからない' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TagResponseDto> {
    const tag = await this.tagUsecase.findOne(id);
    return this.toResponse(tag);
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'タグ作成成功',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 409, description: 'タグ名が重複' })
  @UsePipes(new ZodValidationPipe(createTagSchema))
  async create(@Body() dto: CreateTagInput): Promise<TagResponseDto> {
    const tag = await this.tagUsecase.create(dto);
    return this.toResponse(tag);
  }

  @Patch(':id')
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
  ): Promise<TagResponseDto> {
    const tag = await this.tagUsecase.update(id, dto);
    return this.toResponse(tag);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'タグ削除成功',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'タグが見つからない' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<TagResponseDto> {
    const tag = await this.tagUsecase.remove(id);
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
