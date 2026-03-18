import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileUsecase } from './file.usecase';
import { FileModel } from './file.model';
import { FileResponseDto } from './dto/file-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  uploadFileSchema,
  UploadFileInput,
  copyFileSchema,
  CopyFileInput,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { UserJwtPayload } from '../auth/types';

@Controller('files')
@ApiTags('files')
@UseGuards(PoliciesGuard)
export class FileController {
  constructor(
    private readonly fileUsecase: FileUsecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'ファイルメタデータ取得（署名付きURL付き）',
    type: FileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ファイルが見つからない' })
  @CheckPolicy((ability) => ability.can('read', 'File'))
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<FileResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const file = await this.fileUsecase.findOne(id, ability);
    const url = await this.fileUsecase.getSignedUrl(file.key);
    return this.toResponse(file, url);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        relatedTable: { type: 'string' },
        relatedId: { type: 'number' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'ファイルアップロード成功',
    type: FileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @CheckPolicy((ability) => ability.can('create', 'File'))
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(uploadFileSchema)) dto: UploadFileInput,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<FileResponseDto> {
    const model = await this.fileUsecase.upload(file, dto, user.tenantId);
    const url = await this.fileUsecase.getSignedUrl(model.key);
    return this.toResponse(model, url);
  }

  @Post(':id/copy')
  @ApiBody({ schema: createApiBodySchema(copyFileSchema) })
  @ApiResponse({
    status: 201,
    description: 'ファイルコピー成功',
    type: FileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'コピー元ファイルが見つからない' })
  @CheckPolicy((ability) => ability.can('create', 'File'))
  async copy(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(copyFileSchema)) dto: CopyFileInput,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<FileResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const model = await this.fileUsecase.copy(id, dto, user.tenantId, ability);
    const url = await this.fileUsecase.getSignedUrl(model.key);
    return this.toResponse(model, url);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'ファイル削除成功',
    type: FileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ファイルが見つからない' })
  @CheckPolicy((ability) => ability.can('delete', 'File'))
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<FileResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const file = await this.fileUsecase.remove(id, ability);
    return this.toResponse(file, '');
  }

  private toResponse(model: FileModel, url: string): FileResponseDto {
    return {
      id: model.id,
      originalName: model.originalName,
      mimeType: model.mimeType,
      size: model.size,
      relatedTable: model.relatedTable,
      relatedId: model.relatedId,
      url,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
