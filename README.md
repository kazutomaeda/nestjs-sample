# NestJS Sample TODO API

NestJS + Prisma + SQL Server で構築するマルチテナント TODO API のサンプルプロジェクト。

## 前提条件

- Node.js 22.2.0
- Yarn 1.22.22
- Docker (SQL Server 用)

バージョン管理には [asdf](https://asdf-vm.com/) を使用 (`.tool-versions`)。

## 環境構築

```bash
# 1. 依存パッケージのインストール
yarn install

# 2. 環境変数の設定
cp .env.example .env

# 3. SQL Server の起動
docker compose up -d

# 4. マイグレーション実行
yarn prisma migrate dev

# 5. シードデータ投入
yarn prisma db seed

# 6. 開発サーバーの起動
yarn start:dev
```

起動後 http://localhost:3000/api で Swagger UI を確認できる。

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
| `yarn prisma studio` | Prisma Studio (DB GUI) 起動 |
| `make db` | SQL Server コンソールにログイン |

## 技術スタック

| カテゴリ | 技術 |
| --- | --- |
| フレームワーク | NestJS 10 |
| ORM | Prisma 5 |
| DB | SQL Server 2019 |
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

## マルチテナント

### データ分離方式

共有 DB・共有スキーマ方式を採用する。各テーブルに `tenantId` カラムを持ち、CASL の条件付きルール (`{ tenantId: user.tenantId }`) でクエリレベルのフィルタリングを行う。

### テナント作成

`POST /tenants` でテナントを作成すると、同時にそのテナントの管理者ユーザーが 1 名作成される（アトミック操作）。

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
