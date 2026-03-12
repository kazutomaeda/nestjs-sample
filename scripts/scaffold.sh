#!/bin/bash
set -euo pipefail

# ============================================================
# scaffold.sh - 新規ドメインモジュールの雛形を生成する
#
# Usage: yarn scaffold <domain>
# Example: yarn scaffold product
#
# 生成ファイル:
#   src/<domain>/
#     ├── <domain>.module.ts
#     ├── <domain>.controller.ts
#     ├── <domain>.usecase.ts
#     ├── <domain>.repository.ts
#     ├── <domain>.model.ts
#     ├── <domain>.validator.ts
#     ├── dto/
#     │   └── <domain>-response.dto.ts
#     └── schema/
#         ├── create-<domain>.schema.ts
#         ├── update-<domain>.schema.ts
#         ├── list-<domain>.schema.ts
#         └── index.ts
# ============================================================

if [ $# -lt 1 ]; then
  echo "Usage: yarn scaffold <domain>"
  echo "Example: yarn scaffold product"
  exit 1
fi

DOMAIN="$1"

# --- 命名変換 ---
# kebab-case (入力そのまま)
KEBAB="$DOMAIN"
# camelCase: kebab-case → camelCase (例: order-item → orderItem)
CAMEL="$(echo "$DOMAIN" | awk -F'-' '{for(i=1;i<=NF;i++){if(i==1){printf "%s",$i}else{printf "%s",toupper(substr($i,1,1)) substr($i,2)}}}')"
# PascalCase: 先頭を大文字に (例: orderItem → OrderItem)
PASCAL="$(echo "$CAMEL" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')"
# 複数形 (簡易: 末尾に s)
PLURAL="${KEBAB}s"

DIR="src/${KEBAB}"

if [ -d "$DIR" ]; then
  echo "Error: Directory ${DIR} already exists"
  exit 1
fi

echo "Scaffolding domain: ${DOMAIN}"
echo "  PascalCase: ${PASCAL}"
echo "  camelCase:  ${CAMEL}"
echo "  plural:     ${PLURAL}"
echo ""

mkdir -p "${DIR}/dto" "${DIR}/schema"

# ============================================================
# Model
# ============================================================
cat > "${DIR}/${KEBAB}.model.ts" << EOF
export class ${PASCAL}Model {
  readonly id: number;
  readonly tenantId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(params: {
    id: number;
    tenantId: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.tenantId = params.tenantId;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  // TODO: ドメインに合わせてフィールドと withUpdate を追加
  withUpdate(): ${PASCAL}Model {
    return new ${PASCAL}Model({
      id: this.id,
      tenantId: this.tenantId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
EOF

# ============================================================
# Response DTO
# ============================================================
cat > "${DIR}/dto/${KEBAB}-response.dto.ts" << EOF
export class ${PASCAL}ResponseDto {
  /** ID */
  id: number;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;

  // TODO: ドメインに合わせてフィールドを追加
}
EOF

# ============================================================
# Schema - create
# ============================================================
cat > "${DIR}/schema/create-${KEBAB}.schema.ts" << EOF
import { z } from 'zod';

// TODO: ドメインに合わせてフィールドを追加
export const create${PASCAL}Schema = z.object({});

export type Create${PASCAL}Input = z.infer<typeof create${PASCAL}Schema>;
EOF

# ============================================================
# Schema - update
# ============================================================
cat > "${DIR}/schema/update-${KEBAB}.schema.ts" << EOF
import { z } from 'zod';

// TODO: ドメインに合わせてフィールドを追加
export const update${PASCAL}Schema = z.object({});

export type Update${PASCAL}Input = z.infer<typeof update${PASCAL}Schema>;
EOF

# ============================================================
# Schema - list
# ============================================================
cat > "${DIR}/schema/list-${KEBAB}.schema.ts" << EOF
import { z } from 'zod';
import { paginationSchema, sortOrderSchema } from '../../common/schema';

// TODO: sortBy の enum にドメイン固有のフィールドを追加、フィルタ条件を追加
export const list${PASCAL}Schema = paginationSchema.extend({
  sortBy: z
    .enum(['createdAt'])
    .default('createdAt')
    .openapi({ description: 'ソート対象フィールド', example: 'createdAt' }),
  sortOrder: sortOrderSchema,
});

export type List${PASCAL}Input = z.infer<typeof list${PASCAL}Schema>;
EOF

# ============================================================
# Schema - index
# ============================================================
cat > "${DIR}/schema/index.ts" << EOF
export * from './create-${KEBAB}.schema';
export * from './update-${KEBAB}.schema';
export * from './list-${KEBAB}.schema';
EOF

# ============================================================
# Validator
# ============================================================
cat > "${DIR}/${KEBAB}.validator.ts" << EOF
import { Injectable, NotFoundException } from '@nestjs/common';
import { ${PASCAL}Model } from './${KEBAB}.model';

@Injectable()
export class ${PASCAL}Validator {
  ensureExists(${CAMEL}: ${PASCAL}Model | null, id: number): ${PASCAL}Model {
    if (!${CAMEL}) {
      throw new NotFoundException(\`${PASCAL} with id \${id} was not found\`);
    }
    return ${CAMEL};
  }
}
EOF

# ============================================================
# Repository
# ============================================================
cat > "${DIR}/${KEBAB}.repository.ts" << EOF
import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionClient } from '../prisma/prisma.types';
import { Prisma } from '@prisma/client';
import { ${PASCAL}Model } from './${KEBAB}.model';
import { AppAbility } from '../auth/external/casl-ability.factory';

export interface FindAllQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class ${PASCAL}Repository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    ability: AppAbility,
    query: FindAllQuery,
  ): Promise<{ items: ${PASCAL}Model[]; totalItems: number }> {
    const where: Prisma.${PASCAL}WhereInput = {
      AND: [
        accessibleBy(ability).${PASCAL},
        // TODO: フィルタ条件を追加
      ],
    };

    const paginate = query.limit > 0;

    const [entities, totalItems] = await Promise.all([
      this.prisma.${CAMEL}.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        ...(paginate && {
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
      }),
      this.prisma.${CAMEL}.count({ where }),
    ]);

    return {
      items: entities.map((entity) => this.toModel(entity)),
      totalItems,
    };
  }

  async findById(id: number, ability: AppAbility): Promise<${PASCAL}Model | null> {
    const entity = await this.prisma.${CAMEL}.findFirst({
      where: {
        id,
        AND: [accessibleBy(ability).${PASCAL}],
      },
    });
    return entity ? this.toModel(entity) : null;
  }

  async create(
    params: { tenantId: number },
    tx: TransactionClient,
  ): Promise<${PASCAL}Model> {
    const entity = await tx.${CAMEL}.create({
      data: {
        tenantId: params.tenantId,
        // TODO: フィールドを追加
      },
    });
    return this.toModel(entity);
  }

  async update(
    id: number,
    model: ${PASCAL}Model,
    tx: TransactionClient,
  ): Promise<${PASCAL}Model> {
    const entity = await tx.${CAMEL}.update({
      where: { id },
      data: {
        // TODO: フィールドを追加
      },
    });
    return this.toModel(entity);
  }

  async delete(id: number, tx: TransactionClient): Promise<${PASCAL}Model> {
    const entity = await tx.${CAMEL}.delete({
      where: { id },
    });
    return this.toModel(entity);
  }

  private toModel(entity: Prisma.${PASCAL}GetPayload<object>): ${PASCAL}Model {
    return new ${PASCAL}Model({
      id: entity.id,
      tenantId: entity.tenantId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      // TODO: フィールドを追加
    });
  }
}
EOF

# ============================================================
# Usecase
# ============================================================
cat > "${DIR}/${KEBAB}.usecase.ts" << EOF
import { Injectable } from '@nestjs/common';
import { TransactionService } from '../prisma/transaction.service';
import { ${PASCAL}Repository, FindAllQuery } from './${KEBAB}.repository';
import { ${PASCAL}Model } from './${KEBAB}.model';
import { ${PASCAL}Validator } from './${KEBAB}.validator';
import { Create${PASCAL}Input, Update${PASCAL}Input, List${PASCAL}Input } from './schema';
import { AppAbility } from '../auth/external/casl-ability.factory';

@Injectable()
export class ${PASCAL}Usecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: ${PASCAL}Repository,
    private readonly validator: ${PASCAL}Validator,
  ) {}

  async findAll(
    ability: AppAbility,
    input: List${PASCAL}Input,
  ): Promise<{ items: ${PASCAL}Model[]; totalItems: number }> {
    const query: FindAllQuery = {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
      // TODO: フィルタ条件を追加
    };
    return this.repository.findAll(ability, query);
  }

  async findOne(id: number, ability: AppAbility): Promise<${PASCAL}Model> {
    return this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
  }

  async create(
    input: Create${PASCAL}Input,
    tenantId: number,
  ): Promise<${PASCAL}Model> {
    return this.transaction.run(async (tx) => {
      return this.repository.create(
        { tenantId },
        tx,
      );
    });
  }

  async update(
    id: number,
    input: Update${PASCAL}Input,
    ability: AppAbility,
  ): Promise<${PASCAL}Model> {
    const ${CAMEL} = this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );

    const updated = ${CAMEL}.withUpdate();

    return this.transaction.run(async (tx) => {
      return this.repository.update(id, updated, tx);
    });
  }

  async remove(id: number, ability: AppAbility): Promise<${PASCAL}Model> {
    this.validator.ensureExists(
      await this.repository.findById(id, ability),
      id,
    );
    return this.transaction.run((tx) => {
      return this.repository.delete(id, tx);
    });
  }
}
EOF

# ============================================================
# Controller
# ============================================================
cat > "${DIR}/${KEBAB}.controller.ts" << EOF
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
  UsePipes,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ${PASCAL}Usecase } from './${KEBAB}.usecase';
import { ${PASCAL}Model } from './${KEBAB}.model';
import { ${PASCAL}ResponseDto } from './dto/${KEBAB}-response.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  create${PASCAL}Schema,
  Create${PASCAL}Input,
  update${PASCAL}Schema,
  Update${PASCAL}Input,
  list${PASCAL}Schema,
  List${PASCAL}Input,
} from './schema';
import { createApiBodySchema } from '../common/schema';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckPolicy } from '../auth/decorators/check-policy.decorator';
import { PoliciesGuard } from '../auth/external/policies.guard';
import { CaslAbilityFactory } from '../auth/external/casl-ability.factory';
import { JwtPayload } from '../auth/types';

@Controller('${PLURAL}')
@ApiTags('${PLURAL}')
@UseGuards(PoliciesGuard)
export class ${PASCAL}Controller {
  constructor(
    private readonly ${CAMEL}Usecase: ${PASCAL}Usecase,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: '${PASCAL}一覧取得（ページネーション対応）',
  })
  @CheckPolicy((ability) => ability.can('read', '${PASCAL}'))
  async findAll(
    @Query(new ZodValidationPipe(list${PASCAL}Schema)) query: List${PASCAL}Input,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<${PASCAL}ResponseDto>> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const { items, totalItems } = await this.${CAMEL}Usecase.findAll(ability, query);
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
    description: '${PASCAL}詳細取得',
    type: ${PASCAL}ResponseDto,
  })
  @ApiResponse({ status: 404, description: '${PASCAL}が見つからない' })
  @CheckPolicy((ability) => ability.can('read', '${PASCAL}'))
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<${PASCAL}ResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const ${CAMEL} = await this.${CAMEL}Usecase.findOne(id, ability);
    return this.toResponse(${CAMEL});
  }

  @Post()
  @ApiBody({ schema: createApiBodySchema(create${PASCAL}Schema) })
  @ApiResponse({
    status: 201,
    description: '${PASCAL}作成成功',
    type: ${PASCAL}ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @CheckPolicy((ability) => ability.can('create', '${PASCAL}'))
  @UsePipes(new ZodValidationPipe(create${PASCAL}Schema))
  async create(
    @Body() dto: Create${PASCAL}Input,
    @CurrentUser() user: JwtPayload,
  ): Promise<${PASCAL}ResponseDto> {
    if (user.tenantId === null) {
      throw new ForbiddenException('テナントに所属していません');
    }
    const ${CAMEL} = await this.${CAMEL}Usecase.create(dto, user.tenantId);
    return this.toResponse(${CAMEL});
  }

  @Patch(':id')
  @ApiBody({ schema: createApiBodySchema(update${PASCAL}Schema) })
  @ApiResponse({
    status: 200,
    description: '${PASCAL}更新成功',
    type: ${PASCAL}ResponseDto,
  })
  @ApiResponse({ status: 404, description: '${PASCAL}が見つからない' })
  @CheckPolicy((ability) => ability.can('update', '${PASCAL}'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(update${PASCAL}Schema)) dto: Update${PASCAL}Input,
    @CurrentUser() user: JwtPayload,
  ): Promise<${PASCAL}ResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const ${CAMEL} = await this.${CAMEL}Usecase.update(id, dto, ability);
    return this.toResponse(${CAMEL});
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: '${PASCAL}削除成功',
    type: ${PASCAL}ResponseDto,
  })
  @ApiResponse({ status: 404, description: '${PASCAL}が見つからない' })
  @CheckPolicy((ability) => ability.can('delete', '${PASCAL}'))
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<${PASCAL}ResponseDto> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const ${CAMEL} = await this.${CAMEL}Usecase.remove(id, ability);
    return this.toResponse(${CAMEL});
  }

  // TODO: ドメインに合わせてフィールドを追加
  private toResponse(model: ${PASCAL}Model): ${PASCAL}ResponseDto {
    return {
      id: model.id,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
EOF

# ============================================================
# Module
# ============================================================
cat > "${DIR}/${KEBAB}.module.ts" << EOF
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ${PASCAL}Controller } from './${KEBAB}.controller';
import { ${PASCAL}Repository } from './${KEBAB}.repository';
import { ${PASCAL}Usecase } from './${KEBAB}.usecase';
import { ${PASCAL}Validator } from './${KEBAB}.validator';

@Module({
  imports: [AuthModule],
  controllers: [${PASCAL}Controller],
  providers: [${PASCAL}Usecase, ${PASCAL}Validator, ${PASCAL}Repository],
  // exports は external/ 配下のもののみ
})
export class ${PASCAL}Module {}
EOF

echo ""
echo "✓ Generated ${DIR}/"
echo ""
echo "Next steps:"
echo "  1. Prisma schema に ${PASCAL} モデルを追加"
echo "  2. CASL ability に ${PASCAL} のルールを追加 (src/auth/external/casl-ability.factory.ts)"
echo "  3. AppModule に ${PASCAL}Module を imports に追加 (src/app.module.ts)"
echo "  4. 各ファイルの TODO コメントに従いドメイン固有のフィールドを追加"
echo "  5. yarn prisma db push && yarn build で確認"
