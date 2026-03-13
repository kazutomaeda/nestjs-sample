# NestJS Sample TODO API

NestJS + Prisma + MySQL で構築するマルチテナント API のサンプルプロジェクト。

## 前提条件

- Node.js 22.2.0
- Yarn 1.22.22
- Docker / Docker Compose

バージョン管理には [asdf](https://asdf-vm.com/) を使用 (`.tool-versions`)。

## 環境構築

### Docker Compose で起動（推奨）

```bash
# 1. 環境変数の設定
cp .env.example .env

# 2. 全サービス起動（app, MySQL, MinIO, Mailpit）
docker compose up -d

# 3. DB スキーマ反映
docker compose exec app yarn prisma db push

# 4. シードデータ投入
docker compose exec app yarn prisma db seed
```

### ホスト直接起動

```bash
# 1. 依存パッケージのインストール
yarn install

# 2. 環境変数の設定
cp .env.example .env

# 3. MySQL・MinIO・Mailpit の起動
docker compose up -d mysql minio mailpit

# 4. DB スキーマ反映
yarn prisma db push

# 5. シードデータ投入
yarn prisma db seed

# 6. 開発サーバーの起動
yarn start:dev
```

### アクセス先

| サービス | URL |
| --- | --- |
| Swagger UI | http://localhost:3002/api |
| MinIO Console | http://localhost:9003 (minioadmin / minioadmin) |
| Mailpit Web UI | http://localhost:8025 |

### DB の切り替え

デフォルトは MySQL。他の DB を使用する場合は以下の手順で切り替える。

```bash
# 1. Prisma スキーマを切り替え（prisma generate も自動実行される）
yarn db:use postgresql  # mysql | postgresql | sqlserver | sqlite

# 2. .env の DATABASE_URL を対応する接続文字列に変更
```

対応 DB: MySQL / PostgreSQL / SQL Server / SQLite

### シードユーザー

| ユーザー | メールアドレス | パスワード | ロール |
| --- | --- | --- | --- |
| システム管理者 | `admin@system.example.com` | `Admin123!` | `system_admin` |
| テナントA 管理者 | `admin@tenant-a.example.com` | `Admin123!` | `tenant_admin` |
| テナントA ユーザー | `user@tenant-a.example.com` | `User123!` | `tenant_user` |
| テナントB 管理者 | `admin@tenant-b.example.com` | `Admin123!` | `tenant_admin` |
| テナントB ユーザー | `user@tenant-b.example.com` | `User123!` | `tenant_user` |

## コマンド一覧

| コマンド | 説明 |
| --- | --- |
| `yarn start:dev` | 開発サーバー起動 (watch モード) |
| `yarn build` | ビルド |
| `yarn lint` | ESLint 実行 |
| `yarn test` | 単体テスト実行 |
| `yarn test:e2e` | E2E テスト実行 |
| `yarn db:use <provider>` | DB プロバイダ切り替え (mysql / postgresql / sqlserver / sqlite) |
| `yarn scaffold <domain>` | 新規ドメインモジュールの雛形生成 |
| `yarn prisma studio` | Prisma Studio (DB GUI) 起動 |
| `make db` | DB コンソールにログイン |

## 技術スタック

| カテゴリ | 技術 |
| --- | --- |
| フレームワーク | NestJS 10 |
| ORM | Prisma 5 |
| DB | MySQL 8.0 |
| バリデーション | Zod |
| API ドキュメント | Swagger (nestjs/swagger) |
| テスト | Jest |
| エラーレスポンス | RFC 9457 (Problem Details) |
| 認証 | JWT (Cookie ベース) |
| 認可 | CASL (@casl/prisma) |
| レートリミット | @nestjs/throttler |

## 認証・認可

### 認証方式

JWT トークンを httpOnly Cookie で管理する。Bearer ヘッダは使用しない。

- **Access Token** — `access_token` Cookie、有効期限 15 分
- **Refresh Token** — `refresh_token` Cookie（path: `/auth`）、有効期限 7 日、DB に保存

### 認証エンドポイント

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | ログイン | 不要 |
| `POST` | `/auth/logout` | ログアウト | 必要 |
| `POST` | `/auth/refresh` | トークンリフレッシュ | 不要（Cookie） |
| `GET` | `/auth/me` | 認証ユーザー情報取得 | 必要 |
| `POST` | `/auth/password-reset/request` | パスワードリセット要求 | 不要 |
| `POST` | `/auth/password-reset/confirm` | パスワードリセット実行 | 不要 |

### ロールと権限

3 つのロールで権限を制御する。

| ロール | 説明 |
| --- | --- |
| `system_admin` | 全テナント・全リソースに対する全操作 |
| `tenant_admin` | 自テナント内の全リソースに対する全操作 |
| `tenant_user` | 自テナント内のリソースの読み取り・作成・更新（削除不可） |

権限の詳細は [`docs/RULES.md`](docs/RULES.md) の「認証・認可」セクションを参照。

### レートリミット

| 対象 | リクエスト上限 | 期間 |
| --- | --- | --- |
| 全エンドポイント（デフォルト） | 100 | 60 秒 |
| `POST /auth/login` | 5 | 60 秒 |
| `POST /auth/password-reset/request` | 3 | 60 秒 |
| `POST /auth/password-reset/confirm` | 5 | 60 秒 |

### ヘルスチェック

`GET /health` で DB 接続状態を含むヘルスチェックを返す。認証不要・レートリミット除外。k8s readiness/liveness probe に対応。

### CORS

環境変数 `CORS_ORIGIN` で許可オリジンを設定する。カンマ区切りで複数指定可能。未設定時はリクエストオリジンを動的反映。

### 構造化ログ

pino (`nestjs-pino`) による JSON 構造化ログ。全リクエストに `X-Request-Id` を付与し、ログとエラーレスポンスに含める。開発時は `pino-pretty` で可読表示。外部ログサービスへの連携は pino transport またはインフラ層で対応（アプリコード変更不要）。

## ファイルストレージ

S3 互換ストレージ（MinIO / AWS S3）にファイルをアップロード・管理する。ローカル開発では Docker Compose で MinIO が自動起動し、バケットも自動作成される。

### エンドポイント

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| `POST` | `/files` | ファイルアップロード (multipart/form-data) | 必要 |
| `GET` | `/files/:id` | ファイルメタデータ + 署名付きURL取得 | 必要 |
| `POST` | `/files/:id/copy` | ファイルコピー | 必要 |
| `DELETE` | `/files/:id` | ファイル削除 | 必要 |

### ストレージ実装の差し替え

デフォルトは S3 互換（`S3StorageClient`）。Azure Blob Storage など別のストレージに差し替える場合：

1. `src/file/external/` に `FileStorageClient` を extends した実装クラスを作成する

```typescript
// src/file/external/azure-blob-storage.client.ts
import { Injectable } from '@nestjs/common';
import { FileStorageClient } from './file-storage.client';

@Injectable()
export class AzureBlobStorageClient extends FileStorageClient {
  async upload(key: string, body: Buffer, mimeType: string): Promise<void> { /* ... */ }
  async delete(key: string): Promise<void> { /* ... */ }
  async copy(sourceKey: string, destKey: string): Promise<void> { /* ... */ }
  async getSignedUrl(key: string): Promise<string> { /* ... */ }
}
```

2. `src/file/file.module.ts` の `useClass` を差し替える

```typescript
{ provide: FileStorageClient, useClass: AzureBlobStorageClient },
```

## データエクスポート (CSV / PDF)

一覧データを CSV・PDF ファイルとしてダウンロードする機能。Todo モジュールにサンプル実装済み。

### エンドポイント（Todo の例）

| メソッド | パス | 説明 |
| --- | --- | --- |
| `GET` | `/todos/export/csv` | TODO 一覧を CSV でダウンロード |
| `GET` | `/todos/export/pdf` | TODO 一覧を PDF でダウンロード |

既存のフィルタ・ソートクエリパラメータをそのまま使用できる（ページネーションは無視、全件出力）。

### 他ドメインへの追加手順

#### 1. Module に `CommonModule` を import

```typescript
import { CommonModule } from '../common/common.module';

@Module({
  imports: [AuthModule, CommonModule],
  // ...
})
export class OrderModule {}
```

#### 2. Controller に `CsvExportService` / `PdfExportService` を注入

```typescript
import { CsvExportService, ExportColumn } from '../common/services/csv-export.service';
import { PdfExportService } from '../common/services/pdf-export.service';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderUsecase: OrderUsecase,
    private readonly csvExportService: CsvExportService,
    private readonly pdfExportService: PdfExportService,
  ) {}
}
```

#### 3. カラム定義を `accessor` 関数で記述

`accessor` を使うことで、Model のフィールドだけでなく計算値・加工値も出力できる。

```typescript
private exportColumns(): ExportColumn<OrderModel>[] {
  return [
    { header: 'ID', accessor: (o) => o.id },
    { header: '商品名', accessor: (o) => o.productName },
    { header: '税込金額', accessor: (o) => Math.floor(o.amount * 1.1) },
    { header: 'ステータス', accessor: (o) => o.paid ? '支払済' : '未払い' },
  ];
}
```

#### 4. エクスポートエンドポイントを追加

```typescript
@Get('export/csv')
@ApiProduces('text/csv')
@ApiResponse({ status: 200, description: 'CSV エクスポート' })
async exportCsv(
  @Query(new ZodValidationPipe(exportOrderSchema)) query: ExportOrderInput,
  @CurrentUser() user: JwtPayload,
  @Res({ passthrough: true }) res: Response,
): Promise<StreamableFile> {
  const ability = this.caslAbilityFactory.createForUser(user);
  const orders = await this.orderUsecase.findAllForExport(ability, query);
  const buffer = this.csvExportService.generate(this.exportColumns(), orders);
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="orders.csv"',
  });
  return new StreamableFile(buffer);
}
```

PDF も同様に `pdfExportService.generate(title, columns, rows)` で Buffer を取得して返す。

### PDF レイアウトのカスタマイズ

PDF 生成には [pdfmake](https://pdfmake.github.io/docs/0.3/) を使用。JSON 宣言的にレイアウトを定義できる。

カスタマイズする場合は `PdfExportService.generate()` 内の `docDefinition` を変更する。pdfmake のドキュメント定義（テーブル、カラム幅、スタイル、ヘッダ・フッタ等）はすべて `TDocumentDefinitions` 型で表現される。

```typescript
const docDefinition: TDocumentDefinitions = {
  content: [
    { text: title, style: 'title' },
    {
      table: {
        headerRows: 1,
        widths: [50, '*', 80, 100],  // カラム幅を個別指定
        body: [headerRow, ...bodyRows],
      },
      layout: 'lightHorizontalLines',  // テーブルレイアウト
    },
  ],
  pageSize: 'A4',
  pageOrientation: 'landscape',
  styles: { title: { fontSize: 16, bold: true } },
};
```

## マルチテナント

### データ分離方式

共有 DB・共有スキーマ方式を採用する。各テーブルに `tenantId` カラムを持ち、CASL の条件付きルール (`{ tenantId: user.tenantId }`) でクエリレベルのフィルタリングを行う。

### テナント作成

`POST /tenants` でテナントを作成すると、同時にそのテナントの管理者ユーザーが 1 名作成される（アトミック操作）。

## Scaffold — 新規ドメインモジュールの追加

[Hygen](https://www.hygen.io/) ベースのコードジェネレータ。テンプレートは `_templates/domain/new/` に配置。

### 基本（カラム指定なし）

```bash
yarn scaffold <domain>
```

例: `yarn scaffold product`

最小構成で生成される。各ファイルの TODO コメントに従ってフィールドを追加する。

### カラム指定あり

```bash
yarn scaffold <domain> --fields "<name>:<type>,..."
```

例: `yarn scaffold order --fields "title:string,amount:number,paid:boolean"`

対応する型: `string`, `number`, `boolean`

カラム指定時は全ファイルにフィールドが埋め込まれるため、TODO の手動編集が不要。

### 自動生成・登録される内容

- `src/<domain>/` 配下に 11 ファイル (model, controller, usecase, repository, validator, dto, schema)
- `prisma/schema.prisma` に Model 追加 + Tenant リレーション追加
- `src/auth/external/casl-ability.factory.ts` に CASL ルール追加
- `src/app.module.ts` に Module 登録

### DB 反映 & ビルド確認

```bash
yarn prisma db push && yarn build
```

## ディレクトリ構成

```
src/
├── main.ts                      アプリケーションエントリポイント
├── app.module.ts                ルートモジュール
│
├── auth/                        認証・認可モジュール
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.usecase.ts
│   ├── auth.validator.ts
│   ├── auth.repository.ts
│   ├── auth.entity.ts
│   ├── decorators/                カスタムデコレータ
│   │   ├── public.decorator.ts      @Public() — 認証不要マーク
│   │   ├── current-user.decorator.ts @CurrentUser() — JWT ペイロード取得
│   │   └── check-policy.decorator.ts @CheckPolicy() — CASL ポリシーチェック
│   ├── external/                  他モジュールに公開するもの
│   │   ├── jwt-auth.guard.ts        グローバル認証ガード
│   │   ├── policies.guard.ts        認可ガード
│   │   └── casl-ability.factory.ts   CASL アビリティ定義
│   ├── types/                     型定義 (Role, JwtPayload)
│   ├── dto/
│   └── schema/
│
├── tenant/                      テナント管理モジュール
│   ├── tenant.module.ts
│   ├── tenant.controller.ts
│   ├── tenant.usecase.ts
│   ├── tenant.validator.ts
│   ├── tenant.repository.ts
│   ├── tenant.model.ts
│   ├── tenant.entity.ts
│   ├── dto/
│   └── schema/
│
├── user/                        ユーザー管理モジュール
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
│
├── todo/                        Todo ドメインモジュール
│   ├── todo.module.ts
│   ├── todo.controller.ts
│   ├── todo.usecase.ts
│   ├── todo.validator.ts
│   ├── todo.model.ts
│   ├── todo.entity.ts
│   ├── todo.repository.ts
│   ├── dto/
│   └── schema/
│
├── tag/                         Tag ドメインモジュール
│   ├── tag.module.ts
│   ├── tag.controller.ts
│   ├── tag.usecase.ts
│   ├── tag.validator.ts
│   ├── tag.model.ts
│   ├── tag.entity.ts
│   ├── external/
│   │   ├── tag.repository.ts
│   │   └── tag-resolve.service.ts
│   ├── dto/
│   └── schema/
│
├── health/                      ヘルスチェックモジュール
│   ├── health.module.ts
│   ├── health.controller.ts
│   └── prisma-health.indicator.ts
│
├── common/                      インフラ的な共通関心事
│   ├── filters/                   例外フィルタ (Problem Details 形式)
│   ├── pipes/                     バリデーションパイプ (Zod)
│   └── schema/                    Zod スキーマヘルパー
│
├── config/                      環境変数バリデーション
│
└── prisma/                      Prisma 関連
    ├── prisma.service.ts          PrismaClient ラッパー
    ├── prisma.types.ts            TransactionClient 型定義
    └── transaction.service.ts     トランザクション実行サービス
```

## アーキテクチャ

### レイヤ構成

```
Controller       HTTP ハンドラ。DTO の受け取りと Response の返却
  ↓
Usecase          DTO → Model 変換、処理フロー制御、トランザクション管理
  ↓
Validator        存在チェック、重複チェックなどのビジネスルール検証
Service          他モジュールに公開するドメインロジック
Repository       DB アクセス (Prisma 経由)
```

### 設計方針

- **ドメインモジュールは `src/` 直下に配置する** (`src/modules/` は作らない)
- **他モジュールに公開するものは `external/` に置く** — Module の exports には `external/` 配下のみ
- **Repository は集約単位で操作する** — 中間テーブルは集約ルート側の Repository が扱う
- **リレーションは Model に optional フィールドで定義する** — リレーション有無で別クラスは作らない
- **DTO と Model は常に分離する** — フィールドが同じでも共有しない

詳細なルールは [`docs/RULES.md`](docs/RULES.md) を参照。
