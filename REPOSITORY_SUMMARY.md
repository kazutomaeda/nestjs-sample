# Repository Summary

## Tech Stack

- Language: TypeScript 5.x (`strictNullChecks`, `noImplicitAny` 有効)
- Framework: NestJS 10.x
- Runtime version: Node.js (ES2021 target)
- Package manager: yarn
- DB: SQL Server 2019 (Docker, port 1434)
- ORM: Prisma 5.x (`@prisma/client`)
- Key dependencies:
  - `zod` — リクエストバリデーション + 入力型生成
  - `@asteasolutions/zod-to-openapi` — Zod → OpenAPI スキーマ変換
  - `@nestjs/swagger` — Swagger UI (`/api`)
  - `@nestjs/config` + `class-validator` / `class-transformer` — 環境変数バリデーション
  - `@nestjs/jwt` + `passport` + `passport-jwt` — JWT 認証 (Cookie ベース)
  - `@casl/ability` + `@casl/prisma` — RBAC 認可
  - `@nestjs/throttler` — レートリミット
  - `@nestjs/terminus` — ヘルスチェック
  - `nestjs-pino` + `pino-http` — 構造化ログ (JSON / pino-pretty)
  - `bcrypt` — パスワードハッシュ
  - `cookie-parser` — Cookie パース

## Directory Structure

```
src/
├── main.ts                    # アプリケーション起動・グローバル設定
├── app.module.ts              # ルートモジュール
├── config/
│   └── env.validation.ts      # 環境変数バリデーション (class-validator)
├── prisma/
│   ├── prisma.service.ts      # PrismaClient ラッパー
│   ├── prisma.types.ts        # TransactionClient 型定義
│   ├── prisma.module.ts       # @Global() モジュール (PrismaService, TransactionService)
│   └── transaction.service.ts # トランザクション管理
├── common/
│   ├── filters/
│   │   └── problem-details.filter.ts  # RFC 9457 エラーフィルター
│   ├── pipes/
│   │   └── zod-validation.pipe.ts     # Zod バリデーションパイプ
│   └── schema/
│       ├── schema-helpers.ts          # Zod 共通ビルダー (requiredString, optionalString 等)
│       └── zod-openapi.ts             # createApiBodySchema ヘルパー
├── auth/                      # 認証・認可ドメイン
├── tenant/                    # テナント管理ドメイン
├── user/                      # ユーザー管理ドメイン
├── todo/                      # TODO ドメイン（参照実装）
├── tag/                       # タグドメイン
└── health/                    # ヘルスチェック
```

### ドメインモジュール内部構成（標準パターン）

```
{domain}/
├── {domain}.module.ts
├── {domain}.controller.ts
├── {domain}.usecase.ts
├── {domain}.validator.ts
├── {domain}.model.ts
├── {domain}.entity.ts
├── {domain}.repository.ts        # 非公開 or external/ に配置
├── {domain}.usecase.spec.ts
├── {domain}.validator.spec.ts
├── dto/
│   └── {domain}-response.dto.ts
├── schema/
│   ├── create-{domain}.schema.ts
│   ├── create-{domain}.schema.spec.ts
│   ├── update-{domain}.schema.ts
│   ├── update-{domain}.schema.spec.ts
│   └── index.ts
└── external/                     # 他モジュールに公開するもの（該当する場合）
    ├── {name}.repository.ts
    └── {name}.service.ts
```

## Architecture / Layers

### レイヤ構成

```
Controller → Usecase → Validator / Service / Repository → PrismaService
```

| レイヤ | 責務 | 参照実装 |
|--------|------|---------|
| Controller | HTTP ハンドラ、Zod input 受け取り、Model → Response DTO 変換 | `src/todo/todo.controller.ts` |
| Usecase | 処理の流れ（オーケストレーション）、トランザクション管理 | `src/todo/todo.usecase.ts` |
| Validator | ビジネスバリデーション（存在チェック等）、例外 throw | `src/todo/todo.validator.ts` |
| Service | ビジネスロジック（計算・加工）、external/ 配置時は Repository 注入可 | `src/tag/external/tag-resolve.service.ts` |
| Repository | DB アクセス (Prisma)、Entity → Model 変換 | `src/todo/todo.repository.ts` |
| Model | 不変データクラス (readonly + constructor) | `src/todo/todo.model.ts` |
| Entity | DB テーブル構造の型定義、Repository 内部のみ | `src/todo/todo.entity.ts` |
| Zod Schema | リクエストバリデーション + 入力型生成 + Swagger 入力定義 | `src/todo/schema/create-todo.schema.ts` |
| Response DTO | API レスポンス形式定義 (JSDoc コメント付き) | `src/todo/dto/todo-response.dto.ts` |

### 依存方向

- Controller → Usecase → Repository / Validator / Service
- Repository → PrismaService
- Zod input は Controller と Usecase のみが知る
- Validator / Service / Repository は Model を扱う

### 型の流れ

| 区間 | 型 |
|------|---|
| Client → Controller | Zod input (ZodValidationPipe がパース済み) |
| Controller → Usecase | Zod input |
| Usecase → Repository | Model + tx |
| Repository → Usecase → Controller | Model |
| Controller → Client | Response DTO |

### 変換の責務

| レイヤ | 変換 | メソッド名 |
|--------|------|-----------|
| Repository | Entity → Model | `private toModel()` |
| Controller | Model → Response DTO | `private toResponse()` |

## Naming Conventions

### ファイル名

ケバブケース + サフィックス。

| 種類 | パターン | 例 |
|------|---------|-----|
| Module | `{name}.module.ts` | `todo.module.ts` |
| Controller | `{name}.controller.ts` | `todo.controller.ts` |
| Usecase | `{name}.usecase.ts` | `todo.usecase.ts` |
| Validator | `{name}.validator.ts` | `todo.validator.ts` |
| Model | `{name}.model.ts` | `todo.model.ts` |
| Entity | `{name}.entity.ts` | `todo.entity.ts` |
| Repository | `{name}.repository.ts` | `todo.repository.ts` |
| Response DTO | `{name}-response.dto.ts` | `todo-response.dto.ts` |
| Zod Schema | `{action}-{name}.schema.ts` | `create-todo.schema.ts` |
| テスト | `{name}.spec.ts` | `todo.usecase.spec.ts` |

### フォルダ名

- ドメイン: 単数形 (`todo/`, `user/`, `tag/`)
- ユーティリティ: 複数形 (`filters/`, `pipes/`)

### クラス名

パスカルケース + サフィックス。

| 種類 | パターン | 例 |
|------|---------|-----|
| Module | `{Name}Module` | `TodoModule` |
| Controller | `{Name}Controller` | `TodoController` |
| Usecase | `{Name}Usecase` | `TodoUsecase` |
| Validator | `{Name}Validator` | `TodoValidator` |
| Model | `{Name}Model` | `TodoModel` |
| Entity | `{Name}` (サフィックスなし) | `Todo` |
| Response DTO | `{Name}ResponseDto` | `TodoResponseDto` |
| Repository | `{Name}Repository` | `TodoRepository` |

### メソッド名

| 種類 | パターン | 例 |
|------|---------|-----|
| Controller CRUD | `findAll`, `findOne`, `create`, `update`, `remove` | `todo.controller.ts` |
| Usecase CRUD | `findAll`, `findOne`, `create`, `update`, `remove` | `todo.usecase.ts` |
| Repository CRUD | `findAll`, `findById`, `create`, `update`, `delete` | `todo.repository.ts` |
| Validator | `ensure{条件}` | `ensureExists`, `ensureNameNotDuplicated` |
| 型変換 (Repository) | `private toModel()` | `todo.repository.ts:104` |
| 型変換 (Controller) | `private toResponse()` | `todo.controller.ts:132` |
| Model 更新 | `with{Operation}` | `TodoModel.withUpdate()` |

## Code Patterns

### DI (Dependency Injection)

- 具体クラスを直接注入（インタフェース + Symbol トークンは使わない）
- コンストラクタ依存は最大 4 個
- `PrismaModule` のみ `@Global()` — 他は明示的に `imports` で依存宣言
- 参照実装: `src/todo/todo.usecase.ts:12-17`

```typescript
@Injectable()
export class TodoUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: TodoRepository,
    private readonly validator: TodoValidator,
    private readonly tagResolveService: TagResolveService,
  ) {}
}
```

### Error Handling

- RFC 9457 (Problem Details) 準拠 — `Content-Type: application/problem+json`
- グローバル `ProblemDetailsFilter` で全例外をキャッチして変換
- NestJS 組み込み例外をそのまま使う（カスタム例外クラスは作らない）
- `X-Request-Id` をエラーレスポンスにも含める
- 参照実装: `src/common/filters/problem-details.filter.ts`

### Validation

- **形式チェック**: Zod スキーマ + `ZodValidationPipe`
- **ビジネスバリデーション**: Validator クラス（DI なし、引数のみ）
- 共通 Zod ヘルパー: `requiredString`, `optionalString`, `optionalBoolean`, `positiveInt`, `requiredEmail` (`src/common/schema/schema-helpers.ts`)
- 日本語エラーメッセージ
- 環境変数バリデーション: `class-validator` + `class-transformer` (`src/config/env.validation.ts`)
- 参照実装: `src/todo/schema/create-todo.schema.ts`, `src/common/pipes/zod-validation.pipe.ts`

### Logging

- `nestjs-pino` (pino-http) による構造化ログ
- 開発時: `pino-pretty`、本番: JSON stdout
- `X-Request-Id` ヘッダで全リクエストにリクエスト ID を付与（既存ヘッダ or UUID 生成）
- `bufferLogs: true` + `app.useLogger()` で起動時ログも pino 経由
- 参照実装: `src/app.module.ts:23-37`, `src/main.ts:12-13`

### Authentication

- JWT トークンを httpOnly Cookie で管理（Bearer ヘッダは不使用）
- Access Token: Cookie `access_token`、15 分
- Refresh Token: Cookie `refresh_token`、7 日、path `/auth`、DB 保存
- グローバル `JwtAuthGuard` + `@Public()` デコレータで除外
- トークンローテーション（リフレッシュ時に古いトークン削除）
- 参照実装: `src/auth/auth.controller.ts`, `src/auth/external/jwt-auth.guard.ts`

### Authorization

- CASL (`@casl/ability` + `@casl/prisma`) によるアビリティベース認可
- ロール: `system_admin`, `tenant_admin`, `tenant_user`
- Controller で `@UseGuards(PoliciesGuard)` + `@CheckPolicy()` でエンドポイント認可
- Repository で `accessibleBy(ability).{Model}` でデータフィルタリング（テナント分離）
- `AppAbility` は Controller で生成し、Usecase → Repository に引数として渡す
- 参照実装: `src/auth/external/casl-ability.factory.ts`, `src/todo/todo.controller.ts:47-49`

### Transaction

- Usecase のみがトランザクションを開始 (`TransactionService.run()`)
- Repository の書き込みメソッドは `tx: TransactionClient` を必須引数で受け取る
- Repository の読み取りメソッドは `this.prisma` を直接使う
- 参照実装: `src/todo/todo.usecase.ts:35-43`, `src/prisma/transaction.service.ts`

### Rate Limiting

- `@nestjs/throttler` でグローバル制限 (100 req/60s)
- `APP_GUARD` で `ThrottlerGuard` をグローバル登録
- 個別エンドポイントは `@Throttle()` で上書き
- `@SkipThrottle()` で除外（ヘルスチェック等）
- 参照実装: `src/app.module.ts:38,47-52`, `src/auth/auth.controller.ts:46`

### Multi-tenancy

- 共有 DB・共有スキーマ方式
- 各テーブルに `tenantId` カラム
- CASL の `accessibleBy` でクエリレベルのテナントフィルタリング（手動 `where: { tenantId }` は禁止）
- `system_admin` の `tenantId` は `null`（全テナントアクセス可）

## Testing Patterns

- Test framework: Jest (`ts-jest`)
- テスト配置: ドメインモジュールと同じディレクトリに `*.spec.ts`
- E2E テスト: `test/` ディレクトリに `*.e2e-spec.ts`
- テスト対象: Usecase, Validator, Schema は必須

### Usecase テスト

- `@nestjs/testing` の `Test.createTestingModule` を使用
- `Pick<具体クラス, 'メソッド名'>` で型付きモック（`as any` 禁止）
- `TransactionService.run` は即時実行するモック
- `jest.resetAllMocks()` で毎テストリセット
- 参照実装: `src/todo/todo.usecase.spec.ts`

```typescript
const mockRepository: Pick<TodoRepository, 'findAll' | 'findById' | 'create' | 'update' | 'delete'> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockTransactionService: Pick<TransactionService, 'run'> = {
  run: jest.fn(<T>(fn: (tx: unknown) => Promise<T>) => fn({} as never)),
};
```

### Validator テスト

- DI 不要、`new XxxValidator()` で直接インスタンス化
- 参照実装: `src/todo/todo.validator.spec.ts`

### Schema テスト

- `safeParse` で有効/無効ケースをテスト
- 日本語エラーメッセージの検証
- 余分なフィールドの除去を検証
- 参照実装: `src/todo/schema/create-todo.schema.spec.ts`

## API Design

### Endpoint naming

- RESTful: `GET /todos`, `POST /todos`, `PATCH /todos/:id`, `DELETE /todos/:id`
- 認証: `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`
- ヘルスチェック: `GET /health`

### Request format

- Body: JSON (Zod スキーマでバリデーション)
- パスパラメータ: `ParseIntPipe` で数値変換
- 認証: httpOnly Cookie (`access_token`)

### Response format

- 成功: Response DTO (JSON)
- Swagger: `@ApiResponse`, `@ApiBody({ schema: createApiBodySchema(zodSchema) })`, `@ApiTags`

### Error response format

RFC 9457 (Problem Details):

```json
{
  "type": "https://httpstatuses.com/{status}",
  "title": "{STATUS_TEXT}",
  "status": {status},
  "detail": "{message}",
  "instance": "{request_url}",
  "requestId": "{x-request-id}"
}
```

バリデーションエラー時は `errors` フィールドが追加される。

## Project Rules

### 設計思想

- コンパイル時・起動時に問題を検出する（`as any` 禁止、`process.env` 直接参照禁止、DI を使わない直接インスタンス化禁止）
- 内部 (Model) と外部 (Zod / Response DTO) で型を分離する（フィールドが同じでも常に分離）

### Module ルール

- ドメインモジュールは `src/` 直下（`src/modules/` は作らない）
- `exports` には `external/` 配下のもののみ
- Usecase / Controller は export しない
- `@Global()` は `PrismaModule` のみ

### Repository ルール

- 集約単位で操作（1 Repository = 1 テーブルではない）
- 中間テーブルは集約ルート側の Repository が操作
- リレーション読み取りは `include` 付きメソッドで対応

### 禁止事項

- `prisma migrate` / `db push`（DB は別アプリが管理）
- `new PrismaClient()` の直接使用
- `tenantId` による手動フィルタリング（CASL `accessibleBy` を使う）
- カスタム例外クラスの作成

## Existing Domains

| ドメイン | 概要 | 参照実装 |
|---------|------|---------|
| **todo** | TODO 管理 (CRUD + タグ連携)。最も典型的な参照実装 | `src/todo/` |
| **tag** | タグ管理 (CRUD)。`external/` に Repository と TagResolveService を公開 | `src/tag/` |
| **auth** | 認証 (login, logout, refresh, me, password-reset)。`external/` に JwtAuthGuard, PoliciesGuard, CaslAbilityFactory を公開 | `src/auth/` |
| **tenant** | テナント管理 (CRUD)。テナント + 管理者ユーザーのアトミック作成 | `src/tenant/` |
| **user** | ユーザー管理 (CRUD)。`external/` に UserRepository を公開 | `src/user/` |
| **health** | ヘルスチェック (`GET /health`)。認証不要、レートリミット除外 | `src/health/` |

### ドメイン間依存

```
TodoModule → AuthModule, TagModule
TagModule → AuthModule
TenantModule → AuthModule, UserModule
UserModule → AuthModule
HealthModule → TerminusModule
全モジュール → PrismaModule (@Global)
```

## Infrastructure

| 項目 | 設定 |
|------|------|
| DB | SQL Server 2019 (Docker, port 1434) |
| CORS | 環境変数 `CORS_ORIGIN` (カンマ区切り複数指定可、未設定時は動的反映) |
| 環境変数 | `DATABASE_URL`, `PORT`, `JWT_SECRET` (必須)、`JWT_ACCESS_TOKEN_EXPIRES_IN`, `JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS`, `NODE_ENV`, `CORS_ORIGIN` (任意) |
| Swagger | `http://localhost:3000/api` |
