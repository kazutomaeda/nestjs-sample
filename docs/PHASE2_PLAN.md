# フェーズ2: 運用必須機能 — 計画書

## Goal

本番運用に必要な横断的関心事（構造化ログ・リクエスト ID・ヘルスチェック・CORS）を整備する。

## Non-goals

- 特定クラウドサービスの SDK 組み込み（App Insights SDK, CloudWatch Agent 等はインフラ層で対応）
- APM / メトリクス（Prometheus, Datadog 等）
- カスタムログレベルの動的切り替え
- CDN / リバースプロキシ側の CORS 設定

## Scope / Impact

- 影響範囲: `main.ts`, `app.module.ts`, `env.validation.ts`, `common/` 配下に新規追加、`ProblemDetailsFilter` にリクエスト ID 付与

## Acceptance Criteria

- [ ] JSON 構造化ログが出力される（timestamp, level, context, message, requestId）
- [ ] ログ出力先が pino の transport 設定のみで切り替え可能（アプリコード変更不要）
- [ ] 全リクエストに一意の `requestId` が付与され、レスポンスヘッダ `X-Request-Id` に返される
- [ ] ログ出力にリクエスト ID が自動的に含まれる
- [ ] `GET /health` が DB 接続状態を含むヘルスチェックを返す（認証不要）
- [ ] CORS の許可オリジンが環境変数 `CORS_ORIGIN` で設定可能
- [ ] 既存テスト 17 suites / 111 tests が全件パスする
- [ ] TypeScript コンパイルエラーがない

---

## Task Breakdown

### 2.1 構造化ログ

| # | タスク | 詳細 |
|---|--------|------|
| 2.1.1 | パッケージインストール | `yarn add nestjs-pino pino-http`, `yarn add -D pino-pretty` |
| 2.1.2 | `LoggerModule` を `app.module.ts` に追加 | `LoggerModule.forRoot()` で JSON 出力、開発時は `pino-pretty` |
| 2.1.3 | `main.ts` で Logger を差し替え | `app.useLogger(app.get(Logger))` |
| 2.1.4 | 既存コードとの整合確認 | 現状 `new Logger()` 未使用のため影響なし |

### 2.2 リクエスト ID

| # | タスク | 詳細 |
|---|--------|------|
| 2.2.1 | `pino-http` の `genReqId` で一元処理 | `X-Request-Id` ヘッダがあればそれを使用、なければ UUID 生成。リクエスト・レスポンスヘッダに設定 |
| 2.2.2 | `ProblemDetailsFilter` にリクエスト ID 追加 | エラーレスポンスに `requestId` フィールドを含める |

### 2.3 ヘルスチェック

| # | タスク | 詳細 |
|---|--------|------|
| 2.3.1 | パッケージインストール | `yarn add @nestjs/terminus` |
| 2.3.2 | `HealthModule` 作成 | `src/health/health.module.ts` + `health.controller.ts` |
| 2.3.3 | DB ヘルスインジケータ | `PrismaHealthIndicator` — `prisma.$queryRaw` で接続確認 |
| 2.3.4 | `@Public()` で認証除外 | `GET /health` は認証不要 |

### 2.4 CORS 設定

| # | タスク | 詳細 |
|---|--------|------|
| 2.4.1 | 環境変数追加 | `env.validation.ts` に `CORS_ORIGIN` 追加（optional、デフォルト: `*`） |
| 2.4.2 | `main.ts` で CORS 有効化 | `ConfigService` から `CORS_ORIGIN` を取得して `app.enableCors()` |
| 2.4.3 | `.env.example` に追記 | `CORS_ORIGIN=http://localhost:3000` |

---

## 技術選定

| 項目 | 選定 | 理由 |
|------|------|------|
| ログライブラリ | **pino** (`nestjs-pino`) | NestJS 統合が成熟、JSON 出力がデフォルト、高パフォーマンス |
| リクエスト ID ヘッダ | `X-Request-Id` | 業界標準 |
| ヘルスチェック | `@nestjs/terminus` | NestJS 公式、Kubernetes readiness/liveness probe 対応 |
| CORS 複数オリジン | カンマ区切り → 配列変換 | `CORS_ORIGIN=http://localhost:3000,http://localhost:5173` |

## ログの外部サービス連携設計

pino の **transport** 機構を活用し、アプリコードを一切変更せずにログの出力先を差し替えられる設計にする。

### 方針

- アプリは **常に JSON を stdout に出力** する（pino のデフォルト動作）
- 出力先の変更は `LoggerModule.forRoot()` の transport 設定のみで行う
- 特定クラウドの SDK をアプリ内に組み込まない（インフラ層で対応）

### クラウド別の接続パターン

| クラウド | 接続方法 | アプリ側の変更 |
|---------|---------|---------------|
| **AWS CloudWatch** | コンテナ stdout → CloudWatch Logs Agent が自動収集 | **なし** |
| **Azure App Insights** | 方式A: stdout → Azure Monitor Agent で収集（推奨） | **なし** |
| | 方式B: `pino-applicationinsights` transport を追加 | transport 設定のみ |
| **GCP Cloud Logging** | コンテナ stdout → Cloud Logging が自動収集 | **なし** |
| **ELK / OpenSearch** | `pino-elasticsearch` transport を追加 | transport 設定のみ |
| **Datadog** | Datadog Agent が stdout JSON を自動パース | **なし** |

### transport 追加の例（Azure App Insights）

```typescript
// app.module.ts の LoggerModule 設定に transport を追加するだけ
LoggerModule.forRoot({
  pinoHttp: {
    transport: {
      targets: [
        { target: 'pino-pretty', level: 'info' },                    // 開発用
        { target: 'pino-applicationinsights', level: 'info',          // App Insights
          options: { connectionString: process.env.APPINSIGHTS_CONNECTION_STRING } },
      ],
    },
  },
})
```

### ログフィールド設計

外部サービスでのフィルタ・検索を想定し、以下のフィールドを標準出力する。

| フィールド | 説明 | 例 |
|-----------|------|----|
| `level` | ログレベル（数値） | `30` (info), `50` (error) |
| `time` | Unix タイムスタンプ（ミリ秒） | `1710000000000` |
| `msg` | メッセージ | `"Todo created"` |
| `context` | NestJS のコンテキスト（クラス名） | `"TodoUsecase"` |
| `req.id` | リクエスト ID | `"550e8400-e29b-41d4-a716-446655440000"` |
| `req.method` | HTTP メソッド | `"GET"` |
| `req.url` | リクエスト URL | `"/todos"` |
| `res.statusCode` | レスポンスステータス | `200` |
| `responseTime` | レスポンス時間（ミリ秒） | `12` |

## 新規ファイル

```
src/
└── health/
    ├── health.module.ts
    ├── health.controller.ts
    └── prisma-health.indicator.ts
```

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `package.json` | `nestjs-pino`, `pino-http`, `@nestjs/terminus` 追加、`pino-pretty` (devDep) |
| `src/app.module.ts` | `LoggerModule`（`genReqId` でリクエスト ID 一元管理）, `HealthModule` インポート追加 |
| `src/main.ts` | `app.useLogger()` + `app.enableCors()` 追加 |
| `src/config/env.validation.ts` | `CORS_ORIGIN` 追加 |
| `src/common/filters/problem-details.filter.ts` | レスポンスに `requestId` フィールド追加 |

## 実装順序

1. 2.1 構造化ログ + 2.2 リクエスト ID（密結合のためセットで実装）
2. 2.3 ヘルスチェック
3. 2.4 CORS 設定
4. TSC + テスト確認

## Open Questions

| # | 内容 | 推奨判断 |
|---|------|---------|
| Q1 | 開発時のログ出力フォーマット | `pino-pretty` で人間が読みやすい形式。本番は JSON stdout |
| Q2 | ヘルスチェックのレスポンス形式 | `@nestjs/terminus` デフォルト (`{ status: 'ok', info: { database: { status: 'up' } } }`) |
| Q3 | CORS 未設定時の動作 | `origin: true`（リクエストオリジンを動的反映、`credentials: true` と互換）。本番 `.env` で明示指定を推奨 |
| Q4 | ログの外部サービス連携 | アプリは stdout JSON のみ。クラウド連携はインフラ層 or pino transport で対応 |
