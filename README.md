# NestJS Sample TODO API

NestJS + Prisma + SQL Server で構築する TODO API のサンプルプロジェクト。

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

# 4. DB にテーブルを作成
yarn prisma db push

# 5. Prisma Client の生成
yarn prisma generate

# 6. 開発サーバーの起動
yarn start:dev
```

起動後 http://localhost:3000/api で Swagger UI を確認できる。

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

## ディレクトリ構成

```
src/
├── main.ts                      アプリケーションエントリポイント
├── app.module.ts                ルートモジュール
│
├── common/                      インフラ的な共通関心事
│   ├── filters/                   例外フィルタ (Problem Details 形式)
│   ├── pipes/                     バリデーションパイプ (Zod)
│   └── schema/                    Zod スキーマヘルパー
│
├── config/                      環境変数バリデーション
│
├── prisma/                      Prisma 関連
│   ├── prisma.service.ts          PrismaClient ラッパー
│   ├── prisma.types.ts            TransactionClient 型定義
│   └── transaction.service.ts     トランザクション実行サービス
│
├── todo/                        Todo ドメインモジュール
│   ├── todo.module.ts
│   ├── todo.controller.ts
│   ├── todo.usecase.ts
│   ├── todo.validator.ts
│   ├── todo.model.ts
│   ├── todo.entity.ts
│   ├── todo.repository.ts
│   ├── dto/                       リクエスト / レスポンス DTO
│   └── schema/                    Zod スキーマ定義 + テスト
│
└── tag/                         Tag ドメインモジュール
    ├── tag.module.ts
    ├── tag.controller.ts
    ├── tag.usecase.ts
    ├── tag.validator.ts
    ├── tag.model.ts
    ├── tag.entity.ts
    ├── external/                  他モジュールに公開するもの
    │   ├── tag.repository.ts
    │   └── tag-resolve.service.ts
    ├── dto/
    └── schema/
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
