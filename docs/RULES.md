# NestJS プロジェクトルール

## 設計思想

### コンパイル時・起動時に確定させる

**「実行してみないとわからない」状態を最小化する。** 問題はできるだけ早い段階で検出する。

| 検出タイミング | 仕組み | 例 |
|--------------|--------|-----|
| コンパイル時 | TypeScript の型システム | 型の不一致、存在しないプロパティへのアクセス |
| コンパイル時 | `Pick<T>` 型付きモック | テストのモックが実装と乖離していたら型エラー |
| 起動時 | NestJS DI コンテナ | 依存の注入漏れ、Module exports の不足 |
| 起動時 | ConfigModule の validate | 環境変数の欠落・型不正 |
| リクエスト時（入口） | ZodValidationPipe | リクエストボディの形式不正 |

**やってはいけないこと:**

- `as any` による型の握りつぶし → コンパイル時の検出を無効化してしまう
- `process.env` の直接参照 → 起動時バリデーションを迂回してしまう
- DI を使わない直接インスタンス化（`new XxxRepository()`）→ 起動時の依存チェックを迂回してしまう

### 内部と外部で型を分ける

型は **「誰のためか」** で分離する。フィールドが同じかどうかは関係ない。

| 分類 | 型 | 関心事 |
|------|-----|--------|
| 内部 | Model | ビジネスロジックが扱うデータ |
| 外部 | Zod スキーマ | バリデーション + 入力型の生成 + Swagger 入力定義 |
| 外部 | Response DTO | 外部へ提供する形 |
| DB | Entity | DB テーブル構造 |

- **Model と Response DTO のフィールドが今同じでも、常に分離する**
- Model にフィールドを足しても、Response DTO に足さなければ API には漏れない
- **ルールが単純であるほど守られる。** 「常に分離する」は判断が不要

---

## ディレクトリ構成

ドメインモジュール単位のフラット構成を採用する。

```
src/
├── main.ts
├── app.module.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.usecase.ts
│   ├── auth.validator.ts
│   ├── auth.repository.ts
│   ├── auth.entity.ts
│   ├── decorators/
│   │   ├── public.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── check-policy.decorator.ts
│   ├── external/
│   │   ├── jwt-auth.guard.ts
│   │   ├── policies.guard.ts
│   │   └── casl-ability.factory.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── role.type.ts
│   │   └── jwt-payload.type.ts
│   ├── dto/
│   └── schema/
├── tenant/
│   ├── tenant.module.ts
│   ├── tenant.controller.ts
│   ├── tenant.usecase.ts
│   ├── tenant.validator.ts
│   ├── tenant.repository.ts
│   ├── tenant.model.ts
│   ├── tenant.entity.ts
│   ├── dto/
│   └── schema/
├── user/
│   ├── user.module.ts
│   ├── user.controller.ts
│   ├── user.usecase.ts
│   ├── user.validator.ts
│   ├── user.model.ts
│   ├── user.entity.ts
│   ├── external/
│   │   └── user.repository.ts
│   ├── dto/
│   └── schema/
├── todo/
│   ├── todo.module.ts
│   ├── todo.controller.ts
│   ├── todo.usecase.ts
│   ├── todo.validator.ts
│   ├── todo.model.ts
│   ├── todo.entity.ts
│   ├── todo.repository.ts
│   ├── todo.usecase.spec.ts
│   ├── todo.validator.spec.ts
│   ├── dto/
│   │   └── todo-response.dto.ts
│   └── schema/
│       ├── create-todo.schema.ts
│       ├── create-todo.schema.spec.ts
│       ├── update-todo.schema.ts
│       ├── update-todo.schema.spec.ts
│       └── index.ts
├── tag/
│   ├── tag.module.ts
│   ├── ...
│   └── external/           ← 他モジュールに公開するもの
│       ├── tag.repository.ts
│       └── tag-resolve.service.ts
├── health/
│   ├── health.module.ts
│   ├── health.controller.ts
│   └── prisma-health.indicator.ts
└── common/
    ├── filters/
    ├── pipes/
    └── schema/
```

### 配置ルール

| 種類 | 置き場所 |
|------|---------|
| 機能モジュール | `src/{ドメイン名}/` 直下 |
| Repository / Entity | ドメインモジュール内（他モジュールに公開する場合は `external/`） |
| 横断的関心事 | `src/common/{種類}/` |
| Zod スキーマ | `src/{ドメイン名}/schema/` |
| テスト（単体） | モジュールと同じディレクトリ |
| テスト（E2E） | `test/` |

---

## 命名規則

### ファイル名

すべてケバブケース + サフィックス。NestJS CLI のデフォルトに従う。

| 種類 | パターン | 例 |
|------|---------|-----|
| Module | `{name}.module.ts` | `user.module.ts` |
| Controller | `{name}.controller.ts` | `user.controller.ts` |
| Usecase | `{name}.usecase.ts` | `user.usecase.ts` |
| Service | `{name}.service.ts` | `user.service.ts` |
| Model | `{name}.model.ts` | `user.model.ts` |
| Entity | `{name}.entity.ts` | `user.entity.ts` |
| Repository | `{name}.repository.ts` | `user.repository.ts` |
| Response DTO | `{name}-response.dto.ts` | `user-response.dto.ts` |
| Zod スキーマ | `{action}-{name}.schema.ts` | `create-user.schema.ts` |
| Validator | `{name}.validator.ts` | `user.validator.ts` |
| Guard | `{name}.guard.ts` | `jwt-auth.guard.ts` |
| Interceptor | `{name}.interceptor.ts` | `logging.interceptor.ts` |
| Pipe | `{name}.pipe.ts` | `parse-int.pipe.ts` |
| Filter | `{name}.filter.ts` | `http-exception.filter.ts` |
| Decorator | `{name}.decorator.ts` | `current-user.decorator.ts` |
| 単体テスト | `{name}.spec.ts` | `user.usecase.spec.ts` |
| E2E テスト | `{name}.e2e-spec.ts` | `user.e2e-spec.ts` |

### フォルダ名

| 種類 | 形式 | 例 |
|------|------|-----|
| ドメインフォルダ | **単数形** | `user/`, `order/`, `product/` |
| ユーティリティフォルダ | **複数形** | `guards/`, `pipes/`, `filters/` |

### クラス名

パスカルケース + サフィックス。ファイル名と対応させる。

| 種類 | パターン | 例 |
|------|---------|-----|
| Module | `{Name}Module` | `UserModule` |
| Controller | `{Name}Controller` | `UserController` |
| Usecase | `{Name}Usecase` | `UserUsecase` |
| Service | `{Name}Service` | `UserService` |
| Model | `{Name}Model` | `UserModel` |
| Entity | `{Name}` | `User` |
| Response DTO | `{Name}ResponseDto` | `UserResponseDto` |
| Validator | `{Name}Validator` | `UserValidator` |
| Guard | `{Name}Guard` | `JwtAuthGuard` |

---

## レイヤ構成と DI

### レイヤ全体像

```
Controller          ← HTTP ハンドラ。DTO の受け取りと Response の返却
  ↓ Zod input
Usecase             ← 処理の流れ + トランザクション管理
  ↓ Model (データ)       ↓ tx (トランザクション)
Validator / Service     Repository
(純粋ロジック)            (DB アクセス)
                          ↓
                       PrismaService
```

### データの流れ

```
[リクエスト]
  → Controller (ZodValidationPipe でバリデーション済みの input を受け取る)
    → Usecase (input を受け取り、Repository / Validator / Service を呼ぶ)
      → Validator / Service (Model を受け取り、検証・加工)
      → Repository (Model + tx で書き込み、Model を返す)
    ← Usecase (Model を返す)
  ← Controller (Model → Response DTO に変換して返す)
[レスポンス]
```

### 型の流れ

| 区間 | 流れる型 |
|------|---------|
| Client → Controller | Zod input（ZodValidationPipe がパース済み） |
| Controller → Usecase | Zod input |
| Usecase → Validator / Service | Model |
| Usecase → Repository | Model + tx |
| Repository → Usecase | Model |
| Usecase → Controller | Model |
| Controller → Client | Response DTO |

### 変換の責務

| レイヤ | 変換 |
|--------|------|
| Repository | Entity → Model（private `toModel` メソッド） |
| Controller | Model → Response DTO（private `toResponse` メソッド） |
| Usecase / Validator / Service | 変換しない。Model をそのまま扱う |

### DI ルール

- 具体クラスを直接注入する（NestJS の標準パターン）
- インタフェース + Symbol トークンによる抽象化は原則やらない
- Symbol トークンを使うのは、環境ごとに実装を切り替える場合のみ（例: S3 / Minio）
- **1 クラスのコンストラクタ依存は目安4個**。超える場合は責務の切り出しを検討する（仕方のない場合もある）
- **外部 SDK / API は専用の Client クラスでラップする**。Usecase が SDK を直接扱わない

```typescript
// OK: 具体クラスを直接注入
@Injectable()
export class TodoUsecase {
  constructor(private readonly repository: TodoRepository) {}
}

// NG: 不要なインタフェース + Symbol
@Inject(TODO_REPOSITORY)
private readonly todoRepo: TodoRepository;
```

```typescript
// OK: Client で SDK をラップ
@Injectable()
export class MailClient {
  async send(to: string, subject: string, body: string): Promise<void> { ... }
}

// NG: Service が SDK を直接扱う
@Injectable()
export class UserService {
  constructor(private readonly sesClient: SESClient) {}
}
```

### レイヤごとの注入・公開ルール

| サフィックス | 役割 | Zod input を知るか | 注入可能なもの | Module exports |
|-------------|------|-------------------|---------------|----------------|
| `Usecase` | 処理の流れ + tx 管理 | **知る** | TransactionService, Repository, Validator, Service, Client | **しない** |
| `Validator` | ビジネスバリデーション | 知らない | なし（引数のみ） | する（外部呼び出し可） |
| `Service` | ビジネスロジック（Validator 以外） | 知らない | Repository（`external/` 配置の場合） | する（`external/` 配置の場合） |
| `Repository` | DB アクセス + クエリロジック | 知らない | PrismaService, 引数の tx | する（`external/` 配置の場合） |
| `Client` | 外部 SDK / API のラップ | 知らない | 外部 SDK | Usecase から注入される |

### トランザクションのルール

- **Usecase だけが `TransactionService.run()` でトランザクションを開始し、`tx` を Repository に渡す**
- Repository の書き込みメソッドは `tx: TransactionClient` を必須引数で受け取る
- Repository の読み取りメソッドは `this.prisma` を直接使う（tx 不要）
- Validator は Repository や PrismaService を持たない。データは引数で受け取る
- Service は `external/` 配置の場合のみ Repository を注入できる

---

## Controller

### 書くこと

- HTTP リクエストの受け取り（`@Get`, `@Post`, `@Patch`, `@Delete`）
- パスパラメータ・ボディの型指定（`@Param`, `@Body`）
- `ZodValidationPipe` の適用
- Usecase の呼び出し
- **Model → Response DTO の変換**（`toResponse` メソッド）
- Swagger デコレータ（`@ApiTags`, `@ApiResponse`）

### 書かないこと

- ビジネスロジック / DB アクセス / トランザクション管理
- Repository や PrismaService の直接注入

### 注入できるもの

- **Usecase のみ**

### 実装例

```typescript
@Controller('todos')
@ApiTags('todos')
export class TodoController {
  constructor(private readonly todoUsecase: TodoUsecase) {}

  @Get()
  @ApiResponse({ status: 200, description: 'TODO一覧取得', type: [TodoResponseDto] })
  async findAll(): Promise<TodoResponseDto[]> {
    const todos = await this.todoUsecase.findAll();
    return todos.map((todo) => this.toResponse(todo));
  }

  @Post()
  @ApiResponse({ status: 201, description: 'TODO作成成功', type: TodoResponseDto })
  @UsePipes(new ZodValidationPipe(createTodoSchema))
  async create(@Body() dto: CreateTodoInput): Promise<TodoResponseDto> {
    const todo = await this.todoUsecase.create(dto);
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
```

---

## Usecase

### 書くこと

- **処理の流れ（オーケストレーション）**
- **トランザクションの開始**（`this.transaction.run()`）
- Repository / Validator / Service の呼び出し

### 書かないこと

- ビジネスロジックの実装（Validator / Service に委譲する）
- DB クエリの組み立て / HTTP の関心事 / Model → Response DTO の変換

### 注入できるもの

- TransactionService, Repository, Validator, Service, Client — **目安4個**（超える場合は切り出しを検討）

### Module での扱い

- `providers` に含める。**`exports` には含めない**（Zod input を知っているため）

### 実装例

```typescript
@Injectable()
export class TodoUsecase {
  constructor(
    private readonly transaction: TransactionService,
    private readonly repository: TodoRepository,
    private readonly validator: TodoValidator,
  ) {}

  async findAll(): Promise<TodoModel[]> {
    return this.repository.findAll();
  }

  async findOne(id: number): Promise<TodoModel> {
    return this.validator.ensureExists(await this.repository.findById(id), id);
  }

  async create(input: CreateTodoInput): Promise<TodoModel> {
    return this.transaction.run((tx) => {
      return this.repository.create({ title: input.title }, tx);
    });
  }

  async update(id: number, input: UpdateTodoInput): Promise<TodoModel> {
    const todo = this.validator.ensureExists(
      await this.repository.findById(id),
      id,
    );
    const updated = todo.withUpdate(input.title, input.completed);

    return this.transaction.run((tx) => {
      return this.repository.update(id, updated, tx);
    });
  }
}
```

### 判断基準

- if 文の条件が「データの状態に基づくビジネスルール」→ Validator に切り出す
- if 文の条件が「どの Repository を呼ぶかの分岐」→ Usecase に残す
- 計算・変換ロジック → Service に切り出す

---

## Validator

### 書くこと

- **ビジネスバリデーション**: 存在チェック / 重複チェック / 状態チェック
- NestJS 組み込み例外の throw

### 書かないこと

- DB アクセス（データは引数で受け取る）
- 形式チェック（Zod スキーマの責務）
- 計算・変換（Service の責務）

### 注入できるもの

- **なし**（引数のみ）

### 命名規則

メソッド名は `ensure{条件}` で統一する。

| メソッド名 | 役割 |
|-----------|------|
| `ensureExists` | 存在することを保証 |
| `ensureNameNotDuplicated` | 重複がないことを保証 |
| `ensureNotCompleted` | 未完了であることを保証 |
| `ensureOwner` | 所有者であることを保証 |

### 実装例

```typescript
@Injectable()
export class TodoValidator {
  ensureExists(todo: TodoModel | null, id: number): TodoModel {
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} was not found`);
    }
    return todo;
  }
}
```

### テスト

DB 依存がないため `new TodoValidator()` で直接テストできる。DI 不要。

```typescript
describe('TodoValidator', () => {
  let validator: TodoValidator;

  beforeEach(() => {
    validator = new TodoValidator();
  });

  it('TODOが存在する場合、そのTODOを返す', () => {
    const result = validator.ensureExists(mockTodo, 1);
    expect(result).toEqual(mockTodo);
  });

  it('TODOがnullの場合、NotFoundExceptionを投げる', () => {
    expect(() => validator.ensureExists(null, 999)).toThrow(NotFoundException);
  });
});
```

---

## Service

### 書くこと

- **ビジネスロジック（Validator 以外）**: 計算処理、データ変換・加工
- 他モジュールに公開するドメイン操作（`external/` に配置）

### 書かないこと

- バリデーション / 処理の流れの制御 / HTTP の関心事

### 注入できるもの

- **純粋ロジックの Service**: なし（引数のみ）
- **`external/` 配置の Service**: Repository を注入できる

### Validator と Service の使い分け

| 観点 | Validator | Service |
|------|-----------|---------|
| 目的 | 「ダメな状態を弾く」 | 「データを加工・計算する」 |
| 戻り値 | 検証済みデータ or 例外 | 計算結果・変換結果 |
| 例外 | 投げる | 投げない（原則） |
| 命名 | `ensure~`, `validate~` | `calculate~`, `apply~`, `resolve~` |

### 実装例

```typescript
// 純粋ロジックの Service（引数のみ）
@Injectable()
export class OrderService {
  calculateTotalWithTax(items: OrderItemModel[], taxRate: number): number {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return Math.floor(subtotal * (1 + taxRate));
  }
}

// external/ 配置の Service（Repository を注入、他モジュールに公開）
@Injectable()
export class TagResolveService {
  constructor(private readonly repository: TagRepository) {}

  async resolveTagIds(tagNames: string[], tx: TransactionClient): Promise<number[]> {
    const existing = await this.repository.findByNames(tagNames);
    const existingMap = new Map(existing.map((t) => [t.name, t.id]));
    const newNames = tagNames.filter((name) => !existingMap.has(name));
    const created = newNames.length > 0
      ? await this.repository.createMany(newNames, tx)
      : [];
    return [...existing.map((t) => t.id), ...created.map((t) => t.id)];
  }
}
```

---

## Model

### 書くこと

- **ビジネスの関心事を表すデータ構造**
- `readonly` フィールド + constructor（不変性を保証）
- `withUpdate` 等の immutable 更新メソッド（更新が必要な場合）
- リレーションは optional フィールドで定義（`tags?: TagModel[]`）

### 書かないこと

- DB 固有のカラム（`deletedAt` 等、ビジネスに不要なもの）
- API レスポンス固有のフィールド
- class-validator デコレータ
- private + getter（Java 式）→ `readonly` を使う

### 実装例

```typescript
export class TodoModel {
  readonly id: number;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly tags?: TagModel[];

  constructor(params: {
    id: number;
    title: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
    tags?: TagModel[];
  }) {
    this.id = params.id;
    this.title = params.title;
    this.completed = params.completed;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    this.tags = params.tags;
  }

  withUpdate(title?: string, completed?: boolean): TodoModel {
    return new TodoModel({
      id: this.id,
      title: title ?? this.title,
      completed: completed ?? this.completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tags: this.tags,
    });
  }
}
```

---

## Repository

### 書くこと

- **DB アクセス（CRUD）** + Prisma クエリの組み立て
- **Entity → Model の変換**（`toModel` メソッド）
- 読み取り: `this.prisma` を直接使う
- 書き込み: 引数の `tx: TransactionClient` を使う
- **集約に属する中間テーブルの操作**（1 Repository = 1 テーブルではなく集約単位）

### 書かないこと

- ビジネスロジック / トランザクションの開始 / HTTP の関心事

### 注入できるもの

- PrismaService

### 配置

- ドメインモジュール内に置く。他モジュールに公開する場合は `external/` に配置

### 実装例

```typescript
@Injectable()
export class TodoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TodoModel[]> {
    const entities = await this.prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
      include: { todoTags: { include: { tag: true } } },
    });
    return entities.map((entity) => this.toModel(entity));
  }

  async create(
    params: { title: string; tagIds?: number[] },
    tx: TransactionClient,
  ): Promise<TodoModel> {
    const entity = await tx.todo.create({
      data: {
        title: params.title,
        ...(params.tagIds && {
          todoTags: { create: params.tagIds.map((tagId) => ({ tagId })) },
        }),
      },
      include: { todoTags: { include: { tag: true } } },
    });
    return this.toModel(entity);
  }

  private toModel(entity: TodoWithTodoTags): TodoModel {
    return new TodoModel({
      id: entity.id,
      title: entity.title,
      completed: entity.completed,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      tags: entity.todoTags.map((tt) => new TagModel({ ... })),
    });
  }
}
```

---

## Entity

### 書くこと

- **DB テーブル構造のそのままの表現**（全カラム対応フィールド）
- 中間テーブルの Entity（リレーションがある場合）

### 書かないこと

- class-validator デコレータ / メソッド / ビジネスロジック

### 扱うレイヤ

- **Repository 内部のみ**（外部に漏らさない）

### 実装例

```typescript
export class Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  todoTags?: TodoTag[];
}

export class TodoTag {
  todoId: number;
  tagId: number;
  tag: Tag;
}
```

---

---

## Zod スキーマ

### 書くこと

- **バリデーションルールの定義**（共通ヘルパー `requiredString`, `optionalString` 等を利用）
- `z.infer` による入力型の生成
- 日本語エラーメッセージ
- **`.openapi()` による Swagger メタデータ**（description, example）

### 配置

- `src/{ドメイン名}/schema/{action}-{name}.schema.ts`
- `src/{ドメイン名}/schema/index.ts` で再 export

### ルール

- 形式チェック（型、フォーマット等）は Zod スキーマで行う
- ビジネスバリデーション（重複チェック等）は Validator で行う
- **Zod input を受け取れるのは Usecase だけ**。Validator / Service / Repository は Zod input を知らない

### 実装例

```typescript
import { z } from 'zod';
import { requiredString } from '../../common/schema';

export const createTodoSchema = z.object({
  title: requiredString('タイトル')
    .openapi({ description: 'TODOのタイトル', example: '買い物に行く' }),
  tags: z.array(requiredString('タグ名')).optional()
    .openapi({ description: 'タグ名の配列', example: ['重要', '買い物'] }),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
```

### テスト

```typescript
describe('createTodoSchema', () => {
  it('タイトルのみで有効', () => {
    const result = createTodoSchema.safeParse({ title: 'タスク1' });
    expect(result.success).toBe(true);
  });

  it('タイトルが空文字の場合はエラー', () => {
    const result = createTodoSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
```

---

## Response DTO

### 書くこと

- **API レスポンスの形の定義**
- JSDoc コメント（Swagger の description になる）

### 書かないこと

- class-validator デコレータ / ビジネスに不要な DB カラム

### 扱うレイヤ

- **Controller のみ**（Model → Response DTO に変換して返す）

### 実装例

```typescript
export class TodoResponseDto {
  /** TODO ID */
  id: number;

  /** TODOのタイトル */
  title: string;

  /** 完了フラグ */
  completed: boolean;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;

  /** タグ一覧 */
  tags: TagResponseDto[];
}
```

---

## Module

### 書くこと

- `imports`: 依存する他ドメインの Module
- `controllers`: そのドメインの Controller
- `providers`: Usecase, Validator, Service, Repository
- `exports`: **`external/` 配下のもののみ**（Repository, Service）

### ルール

- **Usecase / Controller は `exports` に含めない**
- 他モジュールの機能を使いたい場合は `imports` で明示的に依存を宣言する（`@Global()` は使わない）

### 実装例

```typescript
@Module({
  imports: [TagModule],
  controllers: [TodoController],
  providers: [TodoUsecase, TodoValidator, TodoRepository],
})
export class TodoModule {}

@Module({
  controllers: [TagController],
  providers: [TagUsecase, TagValidator, TagRepository, TagResolveService],
  exports: [TagRepository, TagResolveService],
})
export class TagModule {}
```

---

## テスト

### モックの書き方

- `as any` でモックを作ることを禁止する
- `Pick<具体クラス, 'メソッド名'>` で型付きモックを作成する

```typescript
// OK: 型付きモック
const mockRepository: Pick<TodoRepository, 'findAll' | 'create'> = {
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue(mockTodo),
};

// NG: as any
const mockRepository = {
  findAll: jest.fn(),
} as any;
```

### テストモジュールの組み立て

```typescript
const module = await Test.createTestingModule({
  providers: [
    TodoUsecase,
    TodoValidator,
    { provide: TodoRepository, useValue: mockRepository },
    { provide: TransactionService, useValue: mockTransactionService },
  ],
}).compile();
```

### ESLint で `as any` を禁止する

```json
{
  "overrides": [
    {
      "files": ["**/*.spec.ts", "**/*.e2e-spec.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "error"
      }
    }
  ]
}
```

---

## ORM / DB

Prisma を使用する。TypeORM は使わない。

### スキーマ

- `prisma/schema.prisma` は `yarn db:use <provider>` で自動生成される（直接編集しない）
- スキーマの変更は `prisma/schemas/schema.{provider}.prisma` に対して行い、全4ファイルに反映する
- 対応 DB: sqlserver, postgresql, mysql, sqlite
- DB 固有の差異（リレーションの `onUpdate` / `onDelete` 等）は各スキーマファイルで個別に管理する
- ドメインごとに Entity ファイル (`{name}.entity.ts`) をドメインモジュール内に作成する

### PrismaService

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### TransactionService

```typescript
@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
```

### マイグレーション

このアプリではマイグレーションを管理しない。既存 DB を別アプリが管理しており、本アプリはデータの読み書きのみ行う。

```bash
npx prisma db pull
npx prisma generate
```

### 禁止事項

- `prisma migrate` / `db push` は実行しない（DB は別アプリが管理）
- Prisma Client を `new PrismaClient()` しない（PrismaService 経由）

---

## Swagger

`@nestjs/swagger` で API ドキュメントを自動生成する。`http://localhost:3000/api` でアクセス。

### セットアップ

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('TODO API')
  .setVersion('1.0')
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

### ルール

- Zod スキーマの各フィールドに `.openapi({ description, example })` を付与する
- Controller には `@ApiBody({ schema: createApiBodySchema(zodSchema) })` で入力スキーマを指定する
- Controller にはレスポンスの型を `@ApiResponse()` で明示
- Response DTO には JSDoc コメントで説明を書く

```typescript
@Controller('todos')
@ApiTags('todos')
export class TodoController {
  @Post()
  @ApiBody({ schema: createApiBodySchema(createTodoSchema) })
  @ApiResponse({ status: 201, description: 'TODO作成成功', type: TodoResponseDto })
  @UsePipes(new ZodValidationPipe(createTodoSchema))
  create(@Body() dto: CreateTodoInput) { ... }
}
```

---

## エラーハンドリング

RFC 9457 (Problem Details for HTTP APIs) に準拠する。

### レスポンス形式

Content-Type: `application/problem+json`

```json
{
  "type": "https://httpstatuses.com/404",
  "title": "Not Found",
  "status": 404,
  "detail": "Todo with id 123 was not found",
  "instance": "/todos/123"
}
```

バリデーションエラー：

```json
{
  "type": "https://httpstatuses.com/400",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "errors": {
    "title": ["タイトルは必須です"]
  }
}
```

### 例外の投げ方

NestJS 組み込み例外をそのまま使う。カスタム例外クラスは作らない。

```typescript
// OK
throw new NotFoundException('Todo with id 123 was not found');
throw new ConflictException('Tag with name "重要" already exists');

// NG: カスタム例外
throw new TodoNotFoundException(todoId);
```

### Exception Filter

グローバルに1つだけ配置し、全エラーを RFC 9457 形式に変換する。

```typescript
// main.ts で登録
app.useGlobalFilters(new ProblemDetailsFilter());
```

---

## ロギング

- `new Logger(クラス名)` でフィールド定義する
- 出力先の切り替えは `main.ts` の Logger 設定で1箇所だけ行う

```typescript
@Injectable()
export class TodoUsecase {
  private readonly logger = new Logger(TodoUsecase.name);

  create(input: CreateTodoInput) {
    this.logger.log('Todo created');
  }
}
```

### 構造化ログ

- pino (`nestjs-pino`) を使用した JSON 構造化ログ
- 開発時は `pino-pretty`、本番は JSON stdout
- ログの外部連携はアプリコード変更不要（pino transport or インフラ層で対応）
- `app.module.ts` の `LoggerModule.forRoot()` で設定
- `main.ts` で `bufferLogs: true` + `app.useLogger()` を使用

---

## リクエスト ID

- 全リクエストに `X-Request-Id` ヘッダを付与
- `pino-http` の `genReqId` で生成（既存ヘッダがあればそれを使用、なければ UUID 生成）
- ログ出力に自動的に含まれる
- `ProblemDetailsFilter` のエラーレスポンスにも `requestId` フィールドとして含まれる

---

## 設定管理

`@nestjs/config` を使用。環境変数は起動時にバリデーションする。

### セットアップ

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
  ],
})
export class AppModule {}
```

### 起動時バリデーション

```typescript
class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsNumber()
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated);
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
}
```

### ルール

- `process.env` を直接参照しない。必ず `ConfigService` 経由
- 環境変数はすべて `EnvironmentVariables` クラスに定義し、起動時バリデーションの対象にする
- `.env` はリポジトリにコミットしない。`.env.example` にキーだけ記載
- `ConfigModule.forRoot()` は `isGlobal: true` にし、各モジュールで import しない

---

## 新規ドメイン追加チェックリスト

1. **Entity** - `src/{name}/{name}.entity.ts`
2. **Model** - `src/{name}/{name}.model.ts`
3. **Repository** - `src/{name}/{name}.repository.ts`（公開する場合は `external/`）
4. **Zod スキーマ** - `src/{name}/schema/` に作成、`index.ts` で再 export、各フィールドに `.openapi()` を付与
5. **Response DTO** - `src/{name}/dto/{name}-response.dto.ts`
6. **Validator** - `src/{name}/{name}.validator.ts`（必要な場合）
7. **Service** - `src/{name}/{name}.service.ts`（計算・加工ロジックがある場合、`external/` に配置）
8. **Usecase** - `src/{name}/{name}.usecase.ts`
9. **Controller** - `src/{name}/{name}.controller.ts`、`@ApiBody({ schema: createApiBodySchema(...) })` を付与
10. **Module** - `src/{name}/{name}.module.ts`、`AppModule` に登録
11. **テスト** - `*.spec.ts`（Usecase, Validator, Schema は必須）

---

## まとめ: 各レイヤの一覧表

| レイヤ | 責務 | DB | tx | 例外 | 型の入出力 |
|--------|------|----|----|------|-----------|
| Controller | HTTP ハンドラ + 型変換 | - | - | - | Zod input → Usecase、Model → ResponseDto |
| Usecase | 流れの制御 + tx 管理 | - | 開始 | - | Zod input → Repository、Model を返す |
| Validator | ビジネス検証 | - | - | 投げる | Model を受け取る |
| Service | ビジネス計算・加工 | - | - | 原則なし | Model を受け取り加工結果を返す |
| Repository | DB アクセス + 型変換 | 直接 | 受け取る | - | params → Entity → Model |
| Entity | DB テーブル構造 | - | - | - | Repository 内部のみ |
| Model | ビジネスデータ | - | - | - | Usecase / Validator / Service |
| Zod スキーマ | バリデーション + 入力型 + Swagger 入力定義 | - | - | - | Controller → Usecase |
| Response DTO | レスポンス形式 | - | - | - | Controller のみ |

---

## 認証

### 方式

JWT トークンを httpOnly Cookie で管理する。Bearer ヘッダは使用しない。

| トークン | Cookie 名 | 有効期限 | path | 保存先 |
|---------|-----------|---------|------|--------|
| Access Token | `access_token` | 15 分 | `/`（デフォルト） | Cookie のみ（DB 保存なし） |
| Refresh Token | `refresh_token` | 7 日 | `/auth` | Cookie + DB（RefreshTokens テーブル） |

### Cookie 設定

```typescript
{
  httpOnly: true,          // JS からアクセス不可
  secure: isProduction,    // 本番では HTTPS 必須
  sameSite: 'strict',      // CSRF 防止
}
```

### グローバル認証ガード

`JwtAuthGuard` を `main.ts` でグローバルガードとして登録する。全エンドポイントに認証を強制し、認証不要なエンドポイントには `@Public()` デコレータで除外する。

```typescript
// main.ts
const jwtAuthGuard = app.get(JwtAuthGuard);
app.useGlobalGuards(jwtAuthGuard);

// 認証不要にする場合
@Public()
@Post('login')
async login() { ... }
```

### 認証フロー

```
[ログイン]
  Client → POST /auth/login (email, password)
  Server → bcrypt.compare でパスワード検証
         → Access Token (JWT) + Refresh Token (ランダム文字列) 生成
         → Cookie にセット + Refresh Token を DB に保存
  Client ← Set-Cookie: access_token, refresh_token

[認証付きリクエスト]
  Client → GET /todos (Cookie: access_token=xxx)
  JwtAuthGuard → Cookie から access_token を取得 → JWT 検証
               → request.user に JwtPayload をセット

[トークンリフレッシュ]
  Client → POST /auth/refresh (Cookie: refresh_token=xxx)
  Server → DB でリフレッシュトークン検証 → 古いトークン削除
         → 新しい Access Token + Refresh Token 生成（トークンローテーション）

[ログアウト]
  Client → POST /auth/logout
  Server → DB からリフレッシュトークン削除 → Cookie クリア
```

### JwtPayload

JWT に含まれるペイロード。`@CurrentUser()` デコレータで取得できる。

```typescript
interface JwtPayload {
  sub: number;              // ユーザー ID
  tenantId: number | null;  // テナント ID（system_admin は null）
  role: Role;               // 'system_admin' | 'tenant_admin' | 'tenant_user'
}
```

### パスワードリセット

1. `POST /auth/password-reset/request` でリセットトークンを生成（ユーザーが存在しなくても 200 を返す — ユーザー列挙防止）
2. `POST /auth/password-reset/confirm` でトークン + 新パスワードを送信
3. パスワード変更時、そのユーザーの全リフレッシュトークンを削除（全セッション無効化）

### 認証に関するファイル配置

| ファイル | 責務 |
|---------|------|
| `auth/auth.controller.ts` | 認証エンドポイント (login, logout, refresh, me, password-reset) |
| `auth/auth.usecase.ts` | 認証ビジネスロジック |
| `auth/auth.repository.ts` | User / RefreshToken / PasswordReset の DB アクセス |
| `auth/auth.validator.ts` | 認証バリデーション (ensureUserExists, ensureRefreshTokenValid 等) |
| `auth/external/jwt-auth.guard.ts` | グローバル認証ガード（Cookie から JWT を検証） |
| `auth/decorators/public.decorator.ts` | `@Public()` — 認証不要マーク |
| `auth/decorators/current-user.decorator.ts` | `@CurrentUser()` — JWT ペイロード取得 |
| `auth/types/jwt-payload.type.ts` | JwtPayload 型定義 |
| `auth/types/role.type.ts` | Role 型定義 (`system_admin`, `tenant_admin`, `tenant_user`) |

### ルール

- **パスワードは bcrypt でハッシュ化する**（ソルトラウンド: 10）
- **リフレッシュトークンは `crypto.randomBytes(32)` で生成する**
- **トークンリフレッシュ時は古いトークンを削除して新しいトークンを発行する**（トークンローテーション）
- **パスワード変更時は全リフレッシュトークンを削除する**
- **ユーザー列挙を防止する**: パスワードリセット要求は、ユーザーが存在しなくても成功レスポンスを返す
- `auth/auth.repository.ts` は Auth モジュール内部でのみ使用する（export しない）

---

## 認可

### CASL によるアビリティベース認可

`@casl/ability` + `@casl/prisma` を使用し、ロールに応じた権限を定義する。

### アビリティ定義

`CaslAbilityFactory.createForUser(user)` でロールに応じたアビリティを生成する。

| ロール | リソース | 権限 | 条件 |
|--------|---------|------|------|
| `system_admin` | all | manage | なし（全操作可能） |
| `tenant_admin` | Todo | manage | `tenantId = user.tenantId` |
| `tenant_admin` | Tag | manage | `tenantId = user.tenantId` |
| `tenant_admin` | User | manage | `tenantId = user.tenantId` |
| `tenant_admin` | Tenant | read, update | `id = user.tenantId` |
| `tenant_user` | Todo | read, create, update | `tenantId = user.tenantId` |
| `tenant_user` | Tag | read | `tenantId = user.tenantId` |
| `tenant_user` | User | read, update | 自分自身のみ (`id = user.sub`) |

### 使い方

認可は 2 段階で適用する。

**1. Controller で `@CheckPolicy()` + `PoliciesGuard`**

エンドポイントレベルでの認可チェック。操作自体が許可されているかを確認する。

```typescript
@Controller('todos')
@UseGuards(PoliciesGuard)
export class TodoController {
  @Get()
  @CheckPolicy((ability) => ability.can('read', 'Todo'))
  async findAll(@CurrentUser() user: JwtPayload) { ... }

  @Delete(':id')
  @CheckPolicy((ability) => ability.can('delete', 'Todo'))
  async remove(@Param('id') id: number) { ... }
}
```

**2. Usecase / Repository で `AppAbility` を使ったデータフィルタリング**

CASL の条件付きルールにより、Repository のクエリレベルでテナント分離を実現する。`@casl/prisma` の `accessibleBy` を使い、Prisma の `where` 句に CASL の条件を自動注入する。

```typescript
// Repository での使用例
async findAll(ability: AppAbility): Promise<TodoModel[]> {
  const entities = await this.prisma.todo.findMany({
    where: accessibleBy(ability).Todo,
    // ...
  });
  return entities.map((e) => this.toModel(e));
}
```

### 認可に関するファイル配置

| ファイル | 責務 |
|---------|------|
| `auth/external/casl-ability.factory.ts` | ロールごとのアビリティ定義 |
| `auth/external/policies.guard.ts` | `@CheckPolicy()` を評価するガード |
| `auth/decorators/check-policy.decorator.ts` | `@CheckPolicy()` デコレータ定義 |

### ルール

- **`CaslAbilityFactory` はロールの追加・権限変更の唯一の変更箇所**
- `PoliciesGuard` は Controller ごとに `@UseGuards(PoliciesGuard)` で適用する（グローバルガードではない）
- `AppAbility` は Controller で生成し、Usecase → Repository に引数として渡す
- **`@Global()` は使わない** — AuthModule を各モジュールの `imports` に明示的に追加する

---

## マルチテナント

### データ分離方式

共有 DB・共有スキーマ方式を採用する。各テーブルに `tenantId` カラムを持ち、CASL の条件付きルール (`{ tenantId: user.tenantId }`) でクエリレベルのフィルタリングを行う。

### テナントスキーマ

```
Tenants
├── id (PK, autoincrement)
├── name
├── created_at
└── updated_at

Users
├── id (PK, autoincrement)
├── tenant_id (FK → Tenants.id, nullable)  ← system_admin は null
├── role ('system_admin' | 'tenant_admin' | 'tenant_user')
├── email (unique)
├── password_hash
├── name
├── created_at
└── updated_at
```

### テナント作成フロー

`POST /tenants` はテナントと管理者ユーザーをアトミックに作成する。

```typescript
async create(input: CreateTenantInput): Promise<TenantModel> {
  const passwordHash = await bcrypt.hash(input.admin.password, 10);
  return this.transaction.run(async (tx) => {
    const tenant = await this.tenantRepository.create({ name: input.name }, tx);
    await this.userRepository.create({
      tenantId: tenant.id,
      role: 'tenant_admin',
      email: input.admin.email,
      passwordHash,
      name: input.admin.name,
    }, tx);
    return tenant;
  });
}
```

### テナント分離の仕組み

1. ユーザーがログインすると JWT に `tenantId` が含まれる
2. CASL のアビリティ定義で `{ tenantId: user.tenantId }` の条件を設定
3. Repository で `accessibleBy(ability).Todo` を `where` 句に渡す
4. Prisma が自動的にテナントフィルタ付きの SQL を生成

**意図的にテナント ID をハードコードで指定する処理は書かない。** CASL の条件が自動的にフィルタリングする。

### ルール

- **`tenantId` による手動フィルタリング (`where: { tenantId }`) は禁止** — CASL の `accessibleBy` を使う
- `system_admin` の `tenantId` は `null`。CASL で `can('manage', 'all')` を設定するため、全テナントのデータにアクセスできる
- テナント作成は `system_admin` のみ可能
- テナント削除時の関連データ（User, Todo, Tag 等）のカスケード削除は DB 制約に委ねる

---

## レートリミット

`@nestjs/throttler` でリクエスト頻度を制限する。インメモリストアを使用。

### 設定

| 対象 | リクエスト上限 | 期間 |
|------|-------------|------|
| 全エンドポイント（グローバル） | 100 | 60 秒 |
| `POST /auth/login` | 5 | 60 秒 |
| `POST /auth/password-reset/request` | 3 | 60 秒 |
| `POST /auth/password-reset/confirm` | 5 | 60 秒 |

### 登録方法

```typescript
// app.module.ts — グローバル設定
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])

// APP_GUARD でグローバルガードとして登録
providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]

// auth.controller.ts — エンドポイント単位の上書き
@Throttle({ default: { ttl: 60000, limit: 5 } })
@Post('login')
async login() { ... }
```

### ルール

- 429 レスポンスは `ProblemDetailsFilter` が自動的に RFC 9457 形式に変換する
- IP ベースの制限（デフォルト動作）
- 設定値はハードコード。環境変数化が必要な場合は `ThrottlerModule.forRootAsync` + `ConfigService` に変更する

---

## ヘルスチェック

- `GET /health` — 認証不要（`@Public()`）、レートリミット除外（`@SkipThrottle()`）
- `@nestjs/terminus` を使用
- `PrismaHealthIndicator` で DB 接続確認
- k8s readiness/liveness probe に対応

---

## CORS

- 環境変数 `CORS_ORIGIN` で許可オリジン設定
- カンマ区切りで複数オリジン指定可能
- 未設定時は `origin: true`（リクエストオリジン動的反映、credentials と互換）
- `credentials: true` 固定（Cookie 認証のため）

## ページネーション・ソート・フィルタ

### 共通パターン

一覧取得エンドポイントには共通のページネーション・ソート・フィルタパターンを適用する。

**共通スキーマ** (`src/common/schema/pagination.schema.ts`):

- `paginationSchema` — `page`（デフォルト: 1）、`limit`（デフォルト: 20、最大: 100）
- `sortOrderSchema` — `asc` / `desc`（デフォルト: `desc`）

**レスポンス型** (`src/common/dto/paginated-response.dto.ts`):

- `PaginatedResponseDto<T>` — `{ items: T[], meta: { page, limit, totalItems, totalPages } }`

### limit=0 で全件取得

`limit=0` を指定すると、ページネーションなしで全件を返す。

- Repository は `skip` / `take` を省略する
- `meta` は `{ page: 1, limit: 0, totalItems: N, totalPages: 1 }` を返す

### ドメイン固有のクエリスキーマ

各ドメインの `schema/list-{domain}.schema.ts` に配置する。

```typescript
// 例: src/todo/schema/list-todo.schema.ts
export const listTodoSchema = paginationSchema.extend({
  sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
  sortOrder: sortOrderSchema,
  title: z.string().min(1).optional(),       // 部分一致
  completed: z.enum(['true', 'false']).transform(...).optional(),  // 完全一致
});
```

### 各レイヤの責務

| レイヤ | 責務 |
|--------|------|
| Controller | `@Query(new ZodValidationPipe(schema))` でバリデーション。`PaginatedResponseDto` に変換して返す |
| Usecase | クエリパラメータを Repository に透過する |
| Repository | `where` / `orderBy` / `skip` / `take` を構築。`{ items, totalItems }` を返す |

### 新規ドメインへの適用手順

1. `src/{domain}/schema/list-{domain}.schema.ts` を作成（`paginationSchema.extend(...)` で拡張）
2. Repository の `findAll` に `query` 引数を追加し、`{ items, totalItems }` を返す
3. Usecase の `findAll` にクエリパラメータを透過
4. Controller で `@Query(new ZodValidationPipe(...))` を追加し、`PaginatedResponseDto` で返す
