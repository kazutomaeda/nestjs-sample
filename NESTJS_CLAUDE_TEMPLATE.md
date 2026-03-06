# NestJS プロジェクト規定

新規 NestJS プロジェクトで `.claude/CLAUDE.md` として使用する。

## パッケージマネージャー

**yarn を使用する。npm は使用禁止。**

---

## レイヤ構成

Usecase / Validator(Service) / Repository の3層 + Controller。

| レイヤ | 責務 | 依存先 | export |
|--------|------|--------|--------|
| Controller | HTTP ハンドラ。リクエスト受付とレスポンス変換 | Usecase のみ | 禁止 |
| Usecase | 処理の流れ + トランザクション管理 | Repository, Validator, PrismaService | 禁止 |
| Validator / Service | 純粋なビジネスロジック。DB を持たない | なし（引数で受け取る） | `external/` に置けば可 |
| Repository | DB アクセス + クエリロジック | PrismaService, Entity | `external/` に置けば可 |

---

## モジュール構成ルール

### ディレクトリ構成

- ドメインモジュールは `src/` 直下に配置する（`src/modules/` は作らない）
- Repository、Service はそのドメインモジュール内に置く（共通の `src/repository/` 等には集約しない）
- 他モジュールに公開するものは `external/` サブディレクトリに置く
- `common/` にはインフラ的な共通関心事（メール、ストレージ等）のみ。ドメインロジックは置かない

```text
src/
  {domain}/
    external/             ← 他モジュールに公開するもの
      {domain}.repository.ts
      {domain}-query.service.ts
    {domain}.module.ts
    {domain}.controller.ts
    {domain}.usecase.ts   ← 非公開
    {domain}.validator.ts
    {domain}.model.ts
    {domain}.entity.ts
    dto/
      {domain}-response.dto.ts
      create-{domain}.dto.ts
      update-{domain}.dto.ts
    schema/
      create-{domain}.schema.ts
      update-{domain}.schema.ts
  common/
    filters/
    pipes/
    schema/
  config/
  prisma/
```

### export ルール

- `module.ts` の exports には `external/` 配下のものだけ書く
- **export 禁止**: Usecase、Controller
- **export 可能**: `external/` に置いた Repository、Service
- 他モジュールの機能を使いたい場合は `imports` で明示的に依存を宣言する
- `@Global()` は DB 接続・設定など本当に全体で使うインフラにのみ使用する

---

## 型の使い分け（Entity / Model / DTO）

| 型 | 役割 | 使用範囲 |
|----|------|----------|
| Entity | DB テーブル構造の表現 | Repository 内部のみ |
| Model | ビジネスの関心事 | Usecase / Validator / Service |
| 入力型 (Zod infer) | API リクエストの形 | Controller → Usecase に渡す |
| Response DTO | API レスポンスの形 | Controller が Model から変換して返す |

**変換責務**:
- Repository が Entity ⇄ Model を変換する
- Controller が Model → Response DTO を変換する

---

## 複数ドメインをまたぐ読み取り

- 既存の Repository に Prisma の `include` 付きメソッドを追加する（専用 Repository は作らない）
- Usecase 側で複数 Repository を呼んでアプリ内結合するパターンは使わない（パフォーマンス懸念）
- リレーション込みの返却型は、基本 Model を extends した別クラスで定義する（optional フィールドで表現しない）

```typescript
class UserModel {
  id: number;
  name: string;
}

class UserWithTodosModel extends UserModel {
  todos: TodoModel[];
}
```

---

## トランザクション

- Usecase だけが `$transaction` を開始し、`tx` を Repository に渡す
- Repository の書き込みメソッドは `tx: TransactionClient` を必須引数で受け取る
- Repository の読み取りメソッドは `this.prisma` を直接使う
- Validator / Service は tx を一切扱わない
- 複数ドメインをまたぐ書き込みは、Usecase が複数の Repository を直接呼ぶ

---

## DI

- NestJS 標準の具体クラス注入を採用する（インターフェース + Symbol トークンは使わない）
- Symbol トークンは環境切り替え（S3/Minio 等）のみ許可
- コンストラクタ依存は最大4個に制限し、超えたら責務分割を検討する

---

## ORM

- Prisma を使用する。TypeORM は使用しない
- マイグレーションは管理しない（既存 DB は別アプリが管理する想定）
- スキーマは `prisma db pull` で生成する

---

## バリデーション

- **形式チェック**: Zod スキーマで定義する。`z.infer` で入力型を自動生成する
- **ビジネスバリデーション**: Validator クラスで実装する（純粋ロジック、データは引数で受け取る）
- エラーメッセージは日本語で記述する
- `src/{domain}/schema/` に Zod スキーマを配置する
- `src/common/schema/` に共通ヘルパー（`requiredString` 等）を配置する

---

## エラーハンドリング

- RFC 9457 (Problem Details) 形式を採用する
- カスタム例外クラスは作らない。NestJS 組み込み例外（`NotFoundException` 等）のみ使用する
- グローバル `ProblemDetailsFilter` で全エラーを統一形式に変換する

---

## テスト

- テストは実装と一緒に書く
- `as any` は禁止（ESLint `no-explicit-any: "error"` で強制）
- `Pick<ConcreteClass, 'method'>` で型付きモックを作成する
- `@golevelup/ts-jest` の `createMock` は不採用（愚直に書く方針）
- Validator は DB 依存がないため `new Validator()` で直接テスト可能

---

## ロギング

- `new Logger(ClassName)` でフィールド定義する（DI 注入ではない）
- 出力先切り替えは `main.ts` で nest-winston + Winston Transport を使用する

---

## Swagger

- CLI Plugin で `@ApiProperty()` を自動生成する。手動で書かない
- DTO の日本語コメントが description になる

---

## 設定管理

- `@nestjs/config` + `ConfigModule.forRoot({ isGlobal: true })` を使用する
- 起動時に環境変数をバリデーションする
- `process.env` の直接参照は禁止する
