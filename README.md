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
make setup
```

これだけで以下が自動実行される：

1. `.env.example` → `.env` のコピー（未作成時のみ）
2. 全サービス起動（app, MySQL, MinIO, Mailpit）
3. MySQL の起動待ち
4. DB スキーマ反映 + Prisma Client 生成
5. シードデータ投入

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

### シードユーザー

Admin と User は別テーブル・別認証フロー。詳細は [認証ガイド](docs/guides/authentication.md) を参照。

**Admin（システム管理者）**

| メールアドレス | パスワード | ログインエンドポイント |
| --- | --- | --- |
| `admin@system.example.com` | `Admin123!` | `POST /admin/auth/login` |

**User（テナントユーザー）**

| メールアドレス | パスワード | ロール | ログインエンドポイント |
| --- | --- | --- | --- |
| `admin@tenant-a.example.com` | `Admin123!` | `tenant_admin` | `POST /auth/login` |
| `user@tenant-a.example.com` | `User123!` | `tenant_user` | `POST /auth/login` |
| `admin@tenant-b.example.com` | `Admin123!` | `tenant_admin` | `POST /auth/login` |
| `user@tenant-b.example.com` | `User123!` | `tenant_user` | `POST /auth/login` |

## コマンド一覧

### yarn

| コマンド | 説明 |
| --- | --- |
| `yarn start:dev` | 開発サーバー起動 (watch モード) |
| `yarn build` | ビルド |
| `yarn lint` | ESLint 実行 |
| `yarn test` | 単体テスト実行 |
| `yarn test:e2e` | E2E テスト実行 |
| `yarn db:use <provider>` | DB プロバイダ切り替え (mysql / postgresql / sqlserver / sqlite) |
| `yarn scaffold --name <domain> --fields "<fields>"` | 新規ドメインモジュールの雛形生成 |
| `yarn prisma studio` | Prisma Studio (DB GUI) 起動 |

### make（Docker 環境）

| コマンド | 説明 |
| --- | --- |
| `make setup` | 初回セットアップ（clone 後に一度だけ実行） |
| `make up` | 全サービス起動 |
| `make rebuild` | app コンテナをリビルド |
| `make db-up` | DB サービスのみ起動 |
| `make db-push` | Prisma スキーマを DB に反映 |
| `make db-generate` | コンテナ内で Prisma Client を再生成 |
| `make db-seed` | シードデータ投入 |
| `make db-login` | DB コンソールにログイン |

## 技術スタック

| カテゴリ | 技術 |
| --- | --- |
| フレームワーク | NestJS 10 |
| ORM | Prisma 5 |
| DB | MySQL 8.0（PostgreSQL / SQL Server / SQLite に切替可能） |
| バリデーション | Zod |
| API ドキュメント | Swagger (nestjs/swagger) |
| テスト | Jest |
| エラーレスポンス | RFC 9457 (Problem Details) |
| 認証 | JWT (httpOnly Cookie) |
| 認可 | CASL (@casl/prisma) |
| レートリミット | @nestjs/throttler |
| ログ | pino (nestjs-pino) |
| メール | nodemailer（Transport 差替可能） |
| ファイルストレージ | S3 互換 (MinIO / AWS S3)（Client 差替可能） |
| PDF | pdfmake |
| コード生成 | Hygen |

## 認証・認可

### 認証方式

Admin と User で認証フローが完全に分離されている。

- **Admin** — `admin_access_token` / `admin_refresh_token` Cookie
- **User** — `user_access_token` / `user_refresh_token` Cookie

JWT トークンを httpOnly Cookie で管理する。Bearer ヘッダは使用しない。

- **Access Token** — 有効期限 15 分
- **Refresh Token** — path 制限付き、有効期限 7 日、DB に保存

### 認証エンドポイント

**Admin（`/admin/auth`）**

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| `POST` | `/admin/auth/login` | ログイン | 不要 |
| `POST` | `/admin/auth/logout` | ログアウト | 必要 |
| `POST` | `/admin/auth/refresh` | トークンリフレッシュ | 不要 |
| `GET` | `/admin/auth/me` | 認証管理者情報取得 | 必要 |
| `POST` | `/admin/auth/password-reset/request` | パスワードリセット要求 | 不要 |
| `POST` | `/admin/auth/password-reset/confirm` | パスワードリセット実行 | 不要 |

**User（`/auth`）**

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | ログイン | 不要 |
| `POST` | `/auth/logout` | ログアウト | 必要 |
| `POST` | `/auth/refresh` | トークンリフレッシュ | 不要 |
| `GET` | `/auth/me` | 認証ユーザー情報取得 | 必要 |
| `POST` | `/auth/password-reset/request` | パスワードリセット要求 | 不要 |
| `POST` | `/auth/password-reset/confirm` | パスワードリセット実行 | 不要 |

### ロールと権限

| ロール | テーブル | 説明 |
| --- | --- | --- |
| Admin（システム管理者） | `Admin` | 全テナント・全リソースに対する全操作 |
| `tenant_admin` | `User` | 自テナント内の全リソースに対する全操作 |
| `tenant_user` | `User` | 自テナント内のリソースの読み取り・作成・更新（削除不可） |

権限の詳細は [認可ガイド](docs/guides/authorization.md) を参照。

### レートリミット

| 対象 | リクエスト上限 | 期間 |
| --- | --- | --- |
| 全エンドポイント（デフォルト） | 100 | 60 秒 |
| ログイン | 5 | 60 秒 |
| パスワードリセット要求 | 3 | 60 秒 |
| パスワードリセット実行 | 5 | 60 秒 |

### ヘルスチェック

`GET /health` で DB 接続状態を含むヘルスチェックを返す。認証不要・レートリミット除外。k8s readiness/liveness probe に対応。

### CORS

環境変数 `CORS_ORIGIN` で許可オリジンを設定する。カンマ区切りで複数指定可能。未設定時はリクエストオリジンを動的反映。

### 構造化ログ

pino (`nestjs-pino`) による JSON 構造化ログ。全リクエストに `X-Request-Id` を付与し、ログとエラーレスポンスに含める。開発時は `pino-pretty` で可読表示。

## 監査ログ

リソースの作成・更新・削除を自動記録する。ポリモーフィックな `actorType`（`'admin'` / `'user'`）+ `actorId` で操作者を追跡。

| エンドポイント | 説明 |
| --- | --- |
| `GET /admin/audit-logs` | 全テナント横断の監査ログ一覧（Admin 専用） |
| `GET /admin/audit-logs/:id` | 監査ログ詳細（Admin 専用） |

詳細は [監査ログガイド](docs/guides/audit-log.md) を参照。

## ファイルストレージ

S3 互換ストレージ（MinIO / AWS S3）にファイルをアップロード・管理する。ローカル開発では Docker Compose で MinIO が自動起動し、バケットも自動作成される。

| メソッド | パス | 説明 |
| --- | --- | --- |
| `POST` | `/files` | ファイルアップロード (multipart/form-data) |
| `GET` | `/files/:id` | ファイルメタデータ + 署名付きURL取得 |
| `POST` | `/files/:id/copy` | ファイルコピー |
| `DELETE` | `/files/:id` | ファイル削除 |

ストレージ実装の差し替えは [ファイルストレージガイド](docs/guides/file-storage.md) を参照。

## メール送信

`MailTransport` インターフェースで抽象化。デフォルトは SMTP（nodemailer）。
ローカル開発では Mailpit で送信メールを確認できる。

AWS SES 等への切り替えは [メールガイド](docs/guides/mail.md) を参照。

## データエクスポート (CSV / PDF)

一覧データを CSV・PDF ファイルとしてダウンロードする機能。Todo モジュールにサンプル実装済み。

| メソッド | パス | 説明 |
| --- | --- | --- |
| `GET` | `/todos/export/csv` | TODO 一覧を CSV でダウンロード |
| `GET` | `/todos/export/pdf` | TODO 一覧を PDF でダウンロード |

他ドメインへの追加方法は [CSV ガイド](docs/guides/csv-export.md)・[PDF ガイド](docs/guides/pdf-export.md) を参照。

## マルチテナント

### データ分離方式

共有 DB・共有スキーマ方式を採用する。各テーブルに `tenantId` カラムを持ち、CASL の条件付きルール (`{ tenantId: user.tenantId }`) でクエリレベルのフィルタリングを行う。

### テナント作成

`POST /tenants` でテナントを作成すると、同時にそのテナントの管理者ユーザーが 1 名作成される（アトミック操作）。

## Scaffold — 新規ドメインモジュールの追加

```bash
yarn scaffold --name <domain> --fields "<name>:<type>,..."
```

例: `yarn scaffold --name product --fields "name:string,price:number,active:boolean"`

以下が自動生成される：

- `src/<domain>/` 配下に 11 ファイル (model, controller, admin-controller, usecase, admin-usecase, repository, validator, dto, schema)
- `prisma/schema.prisma` に Model 追加 + Tenant リレーション追加
- `src/auth/external/casl-ability.factory.ts` に CASL ルール追加
- `src/app.module.ts` に Module 登録

詳細は [scaffold ガイド](docs/guides/scaffold.md) を参照。

## ディレクトリ構成

```text
src/
├── main.ts                      アプリケーションエントリポイント
├── app.module.ts                ルートモジュール
│
├── auth/                        認証・認可モジュール
│   ├── auth.module.ts
│   ├── admin/                     Admin 認証
│   │   ├── admin-auth.controller.ts   @Controller('admin/auth')
│   │   ├── admin-auth.usecase.ts
│   │   ├── admin-auth.repository.ts
│   │   └── admin-auth.validator.ts
│   ├── user/                      User 認証
│   │   ├── user-auth.controller.ts    @Controller('auth')
│   │   ├── user-auth.usecase.ts
│   │   ├── user-auth.repository.ts
│   │   └── user-auth.validator.ts
│   ├── decorators/                カスタムデコレータ
│   │   ├── public.decorator.ts      @Public() — 認証不要マーク
│   │   ├── current-user.decorator.ts @CurrentUser() — JWT ペイロード取得
│   │   └── check-policy.decorator.ts @CheckPolicy() — CASL ポリシーチェック
│   ├── external/                  他モジュールに公開するもの
│   │   ├── composite-auth.guard.ts    パスベースの認証ガード振り分け
│   │   ├── admin-auth.guard.ts        Admin 認証ガード
│   │   ├── user-auth.guard.ts         User 認証ガード
│   │   ├── policies.guard.ts          認可ガード
│   │   └── casl-ability.factory.ts    CASL アビリティ定義
│   └── types/                     型定義 (Role, JwtPayload)
│
├── admin/                       Admin モデル
│   └── admin.model.ts
│
├── tenant/                      テナント管理モジュール
├── user/                        ユーザー管理モジュール
├── todo/                        Todo ドメインモジュール
│   ├── todo.controller.ts         User 向け CRUD
│   ├── admin-todo.controller.ts   Admin 向け CRUD
│   ├── todo.usecase.ts
│   ├── admin-todo.usecase.ts
│   └── ...
├── tag/                         Tag ドメインモジュール
├── file/                        ファイルストレージモジュール
├── audit-log/                   監査ログモジュール
├── mail/                        メール送信モジュール
│   ├── mail-transport.interface.ts  Transport インターフェース
│   ├── smtp-mail.transport.ts       SMTP 実装（差替可能）
│   └── external/
│       └── mail.service.ts          公開サービス
├── health/                      ヘルスチェックモジュール
│
├── common/                      インフラ的な共通関心事
│   ├── types/
│   │   └── id.type.ts               ResourceId / ParseIdPipe / zodId
│   ├── filters/                     例外フィルタ (Problem Details 形式)
│   ├── pipes/                       バリデーションパイプ (Zod)
│   ├── services/                    CSV・PDF エクスポートサービス
│   ├── dto/                         PaginatedResponseDto 等
│   └── schema/                      Zod スキーマヘルパー
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

```text
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
- **ID 型は `ResourceId` で一元管理する** — 将来の UUID/ULID 移行に備える

詳細なルールは [`docs/RULES.md`](docs/RULES.md) を参照。

## 開発ガイド

よくある開発シーンごとのガイドを `docs/guides/` に用意している。

| ガイド | 内容 |
| --- | --- |
| [認証](docs/guides/authentication.md) | Admin/User 分離、Cookie、JWT Payload |
| [認可](docs/guides/authorization.md) | CASL 権限定義、新リソースの権限追加 |
| [テーブル・カラム変更](docs/guides/schema-migration.md) | Prisma スキーマ変更と反映手順 |
| [ID 型の変更](docs/guides/id-migration.md) | ULID / UUID への移行手順 |
| [DB 切り替え](docs/guides/db-switching.md) | プロジェクト開始時の DB プロバイダ選定 |
| [scaffold](docs/guides/scaffold.md) | ドメインモジュールの雛形生成 |
| [監査ログ](docs/guides/audit-log.md) | 監査ログの記録方法 |
| [メール送信](docs/guides/mail.md) | Transport の切り替え（SMTP → SES 等） |
| [ファイルストレージ](docs/guides/file-storage.md) | Storage Client の切り替え（S3 → GCS 等） |
| [PDF エクスポート](docs/guides/pdf-export.md) | PDF エクスポートの実装方法 |
| [CSV エクスポート](docs/guides/csv-export.md) | CSV エクスポートの実装方法 |
