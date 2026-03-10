# 認証・テナント設計方針

## 概要

マルチテナントSaaS向けの認証・認可設計。

---

## 認証方式

### JWT in Cookie（httpOnly）

| 項目 | 値 |
|------|-----|
| Access Token 有効期限 | 15分 |
| Refresh Token 有効期限 | 7日 |
| Refresh Token 保存 | DB（無効化対応） |
| Cookie 属性 | httpOnly, Secure, SameSite=Strict |
| CSRF 対策 | SameSite=Strict（追加対策不要） |
| パスワードハッシュ | bcrypt |

### 選定理由

- **JWT**: テナントIDをclaimに含められる、ステートレスでスケール容易
- **Cookie**: httpOnlyでXSS対策、フロントエンドの要件に合致
- **Refresh Token DB保存**: ログアウト時の即時無効化、セキュリティ監査

---

## テナント設計

### User / Tenant 関係

```
Tenant (1) ← (N) User
```

- 1つのテナントに複数のユーザーが所属
- ユーザーは1つのテナントにのみ所属

### テナント分離方式

**CASL による統一的な制御**を採用。

- 全テーブルに `tenantId` カラムを追加
- CASL の `accessibleBy(ability)` でテナントフィルタと権限チェックを同時に実行
- 中間テーブルは親テーブル経由でのみアクセス（tenantId不要）

### テナントコンテキスト

- Guard で JWT から `tenantId`, `userId`, `role` を抽出
- `CaslAbilityFactory` でユーザーの Ability を生成
- Repository は `accessibleBy(ability)` を使用してクエリ

---

## API エンドポイント

### 認証

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| POST | `/auth/login` | ログイン | 不要 |
| POST | `/auth/logout` | ログアウト（Refresh Token 無効化） | 必要 |
| POST | `/auth/refresh` | トークンリフレッシュ | Refresh Token |
| GET | `/auth/me` | 認証ユーザー情報取得 | 必要 |
| POST | `/auth/password-reset/request` | パスワードリセット要求 | 不要 |
| POST | `/auth/password-reset/confirm` | パスワードリセット実行 | トークン |

### 認証フロー

```
[ログイン]
POST /auth/login { email, password }
    ↓
Set-Cookie: access_token=<JWT>; HttpOnly; Secure; SameSite=Strict
Set-Cookie: refresh_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh
    ↓
{ user: { id, name, tenantId, roles } }

[認証付きリクエスト]
GET /todos
Cookie: access_token=<JWT>
    ↓
Guard: JWT検証 → tenantId, userId 抽出 → AsyncLocalStorage に保存
    ↓
Controller → Usecase → Repository（自動でtenantIdフィルタ）

[トークンリフレッシュ]
POST /auth/refresh
Cookie: refresh_token=<JWT>
    ↓
新しい access_token を Set-Cookie

[ログアウト]
POST /auth/logout
    ↓
Refresh Token を DB から削除
Cookie を削除（MaxAge=-1）
```

---

## JWT Payload

```json
{
  "sub": "user-id",
  "tenantId": "tenant-id",
  "role": "tenant_user",
  "iat": 1709971200,
  "exp": 1709972100
}
```

---

## 権限（認可）設計

### ライブラリ

**CASL** を採用。

```bash
yarn add @casl/ability @casl/prisma
```

### ロール定義（固定）

| ロール | スコープ | 説明 |
|--------|----------|------|
| `system_admin` | システム全体 | 開発者・運営。tenantId は null |
| `tenant_admin` | 所属テナント | テナント管理者 |
| `tenant_user` | 所属テナント | 一般ユーザー |

### パーミッション定義（コードで管理）

```typescript
// src/auth/casl/permissions.ts
export const PERMISSIONS = {
  system_admin: ['manage:all'],  // 全権限
  tenant_admin: [
    'todo:manage',
    'tag:manage',
    'user:read',
    'user:manage',
    'tenant:read',
    'tenant:manage',
  ],
  tenant_user: [
    'todo:read',
    'todo:create',
    'todo:update',
    'tag:read',
    'user:read',  // 自分の情報のみ
  ],
} as const;
```

### Ability 定義

```typescript
// src/auth/casl/casl-ability.factory.ts
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { Todo, Tag, User, Tenant } from '@prisma/client';

type AppSubjects = Subjects<{
  Todo: Todo;
  Tag: Tag;
  User: User;
  Tenant: Tenant;
}> | 'all';

export type AppAbility = PureAbility<[string, AppSubjects], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: JwtPayload): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    switch (user.role) {
      case 'system_admin':
        can('manage', 'all');
        break;
      case 'tenant_admin':
        can('manage', 'Todo', { tenantId: user.tenantId });
        can('manage', 'Tag', { tenantId: user.tenantId });
        can('read', 'User', { tenantId: user.tenantId });
        can('manage', 'User', { tenantId: user.tenantId });
        can('read', 'Tenant', { id: user.tenantId });
        can('manage', 'Tenant', { id: user.tenantId });
        break;
      case 'tenant_user':
        can('read', 'Todo', { tenantId: user.tenantId });
        can('create', 'Todo', { tenantId: user.tenantId });
        can('update', 'Todo', { tenantId: user.tenantId });
        can('read', 'Tag', { tenantId: user.tenantId });
        can('read', 'User', { id: user.sub });  // 自分の情報のみ
        break;
    }

    return build();
  }
}
```

### Guard

```typescript
// src/auth/guards/policies.guard.ts
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const policyHandler = this.reflector.get<PolicyHandler>('policy', handler);
    
    if (!policyHandler) return true;

    const request = context.switchToHttp().getRequest();
    const ability = this.caslAbilityFactory.createForUser(request.user);

    return policyHandler(ability);
  }
}
```

### デコレータ

```typescript
// src/auth/decorators/check-policy.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { AppAbility } from '../casl/casl-ability.factory';

export type PolicyHandler = (ability: AppAbility) => boolean;

export const CheckPolicy = (handler: PolicyHandler) =>
  SetMetadata('policy', handler);
```

### Controller での使用

```typescript
@Controller('todos')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class TodoController {
  
  @Get()
  @CheckPolicy((ability) => ability.can('read', 'Todo'))
  findAll() { ... }

  @Post()
  @CheckPolicy((ability) => ability.can('create', 'Todo'))
  create() { ... }

  @Delete(':id')
  @CheckPolicy((ability) => ability.can('delete', 'Todo'))
  remove() { ... }
}
```

### Repository での使用（テナント分離）

```typescript
// CASL + Prisma でテナントフィルタを自動適用
import { accessibleBy } from '@casl/prisma';

async findAll(ability: AppAbility): Promise<TodoModel[]> {
  const entities = await this.prisma.todo.findMany({
    where: accessibleBy(ability).Todo,  // tenantId フィルタが自動適用
  });
  return entities.map((e) => this.toModel(e));
}
```

---

## DB スキーマ

### Tenant

```prisma
model Tenant {
  id        Int       @id @default(autoincrement())
  name      String
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  users     User[]

  @@map("Tenants")
}
```

### User

```prisma
model User {
  id             Int            @id @default(autoincrement())
  tenantId       Int?           @map("tenant_id")  // system_admin は null
  role           String         // 'system_admin' | 'tenant_admin' | 'tenant_user'
  email          String         @unique
  passwordHash   String         @map("password_hash")
  name           String
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  tenant         Tenant?        @relation(fields: [tenantId], references: [id])
  refreshTokens  RefreshToken[]
  passwordResets PasswordReset[]

  @@map("Users")
}
```

### ロール型定義（TypeScript）

```typescript
// src/auth/types/role.type.ts
export const ROLES = ['system_admin', 'tenant_admin', 'tenant_user'] as const;
export type Role = typeof ROLES[number];
```

### RefreshToken

```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id])

  @@map("RefreshTokens")
}
```

### PasswordReset

```prisma
model PasswordReset {
  id        Int       @id @default(autoincrement())
  userId    Int       @map("user_id")
  token     String    @unique
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")
  user      User      @relation(fields: [userId], references: [id])

  @@map("PasswordResets")
}
```

### 既存テーブルへの追加

```prisma
model Todo {
  // 既存フィールド...
  tenantId  Int @map("tenant_id")  // 追加
}

model Tag {
  // 既存フィールド...
  tenantId  Int @map("tenant_id")  // 追加
}
```

---

## ディレクトリ構成

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.usecase.ts
│   ├── auth.validator.ts
│   ├── auth.model.ts
│   ├── auth.repository.ts
│   ├── auth.entity.ts
│   ├── casl/
│   │   ├── casl-ability.factory.ts
│   │   └── permissions.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── policies.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── check-policy.decorator.ts
│   ├── types/
│   │   └── role.type.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── password-reset-request.dto.ts
│   │   ├── password-reset-confirm.dto.ts
│   │   └── auth-user-response.dto.ts
│   └── schema/
│       ├── login.schema.ts
│       ├── password-reset-request.schema.ts
│       ├── password-reset-confirm.schema.ts
│       └── index.ts
├── tenant/
│   ├── tenant.module.ts
│   ├── tenant.model.ts
│   ├── tenant.entity.ts
│   └── external/
│       └── tenant.repository.ts
├── user/
│   ├── user.module.ts
│   ├── user.model.ts
│   ├── user.entity.ts
│   └── external/
│       └── user.repository.ts
└── common/
    └── context/
        └── tenant.context.ts  ← AsyncLocalStorage
```

---

## Guard 適用方針

### グローバル適用 + @Public() で除外

```typescript
// main.ts or app.module.ts
app.useGlobalGuards(new JwtAuthGuard());

// 認証不要なエンドポイント
@Public()
@Post('login')
login() { ... }
```

**理由**: 認証の付け忘れを防ぐ（デフォルト認証必須）

---

## 追加パッケージ

```bash
yarn add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt @casl/ability @casl/prisma
yarn add -D @types/passport-jwt @types/bcrypt
```

---

## 初期リリースに含めるもの

- [x] ログイン / ログアウト
- [x] トークンリフレッシュ
- [x] 認証ユーザー情報取得（/auth/me）
- [x] パスワードリセット
- [x] テナント分離（CASL）
- [x] 権限管理（CASL + ロール + パーミッション）

## 将来追加

- [ ] メール認証
- [ ] 2FA（二要素認証）
- [ ] OAuth連携（Google, GitHub等）
- [ ] ログイン履歴
- [ ] アカウントロック（N回失敗で）
- [ ] カスタムロール / パーミッションのDB管理
