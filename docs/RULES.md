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
- **1 クラスのコンストラクタ依存は最大4個**。超えたら責務の分割を検討する
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

- TransactionService, Repository, Validator, Service, Client — **最大4個まで**

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

- `prisma/schema.prisma` にスキーマを定義する
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
