import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditLogUsecase } from './audit-log.usecase';
import { AuditLogModel } from './audit-log.model';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { listAuditLogSchema, ListAuditLogInput } from './schema';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { UserJwtPayload } from '../auth/types';

@Controller('audit-logs')
@ApiTags('audit-logs')
@UseGuards(PoliciesGuard)
export class AuditLogController {
  constructor(
    private readonly auditLogUsecase: AuditLogUsecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: '監査ログ一覧取得（ページネーション対応）',
  })
  @CheckPolicy((ability) => ability.can('read', 'AuditLog'))
  async findAll(
    @Query(new ZodValidationPipe(listAuditLogSchema)) query: ListAuditLogInput,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<PaginatedResponseDto<AuditLogResponseDto>> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const { items, totalItems } = await this.auditLogUsecase.findAll(
      ability,
      query,
    );
    return {
      items: items.map((log) => this.toResponse(log)),
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
    description: '監査ログ詳細取得',
    type: AuditLogResponseDto,
  })
  @ApiResponse({ status: 404, description: '監査ログが見つからない' })
  @CheckPolicy((ability) => ability.can('read', 'AuditLog'))
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserJwtPayload,
  ): Promise<AuditLogResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const log = await this.auditLogUsecase.findOne(id, ability);
    return this.toResponse(log);
  }

  private toResponse(model: AuditLogModel): AuditLogResponseDto {
    return {
      id: model.id,
      tenantId: model.tenantId,
      actorType: model.actorType,
      actorId: model.actorId,
      action: model.action,
      resourceType: model.resourceType,
      resourceId: model.resourceId,
      before: model.before,
      after: model.after,
      createdAt: model.createdAt,
    };
  }
}
