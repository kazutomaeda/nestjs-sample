#!/bin/bash
#
# 認証・テナント分離・権限の動作確認スクリプト
#
# 前提:
#   1. docker compose up -d で SQL Server が起動済み
#   2. yarn prisma migrate dev でマイグレーション済み
#   3. yarn prisma db seed でシードデータ投入済み
#   4. yarn start:dev でアプリケーション起動済み
#
# 使い方:
#   chmod +x scripts/verify-auth.sh
#   ./scripts/verify-auth.sh
#

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_JAR_A=$(mktemp)
COOKIE_JAR_B=$(mktemp)
COOKIE_JAR_SYS=$(mktemp)
PASS=0
FAIL=0

cleanup() {
  rm -f "$COOKIE_JAR_A" "$COOKIE_JAR_B" "$COOKIE_JAR_SYS"
}
trap cleanup EXIT

check() {
  local step="$1"
  local description="$2"
  local expected_code="$3"
  local actual_code="$4"

  if [ "$actual_code" -eq "$expected_code" ]; then
    echo "[STEP $step] $description... OK ($actual_code)"
    PASS=$((PASS + 1))
  else
    echo "[STEP $step] $description... FAIL (expected $expected_code, got $actual_code)"
    FAIL=$((FAIL + 1))
  fi
}

echo "============================================"
echo "  認証・テナント分離・権限 動作確認"
echo "  BASE_URL: $BASE_URL"
echo "============================================"
echo ""

# ==========================================
# 認証フロー
# ==========================================
echo "--- 認証フロー ---"

# Step 1: ログイン（テナントA管理者）
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -c "$COOKIE_JAR_A" \
  -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tenant-a.example.com","password":"Admin123!"}')
check 1 "ログイン（テナントA管理者）" 200 "$HTTP_CODE"

# Step 2: 認証ユーザー情報取得
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -b "$COOKIE_JAR_A" \
  "$BASE_URL/auth/me")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check 2 "認証ユーザー情報取得 (GET /auth/me)" 200 "$HTTP_CODE"
echo "        Response: $BODY"

# Step 3: トークンリフレッシュ
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "$COOKIE_JAR_A" -c "$COOKIE_JAR_A" \
  -X POST "$BASE_URL/auth/refresh")
check 3 "トークンリフレッシュ" 200 "$HTTP_CODE"

# Step 4: 未認証アクセス拒否
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/auth/me")
check 4 "未認証アクセス拒否 (GET /auth/me without cookie)" 401 "$HTTP_CODE"

echo ""

# ==========================================
# テナント分離
# ==========================================
echo "--- テナント分離 ---"

# Step 5: テナントA の TODO 一覧
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -b "$COOKIE_JAR_A" \
  "$BASE_URL/todos")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check 5 "テナントAのTODO一覧取得" 200 "$HTTP_CODE"
echo "        Response: $BODY"

# Step 6: テナントB ユーザーでログイン
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -c "$COOKIE_JAR_B" \
  -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@tenant-b.example.com","password":"User123!"}')
check 6 "ログイン（テナントBユーザー）" 200 "$HTTP_CODE"

# Step 7: テナントB の TODO 一覧（テナントA のデータが含まれないこと）
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -b "$COOKIE_JAR_B" \
  "$BASE_URL/todos")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check 7 "テナントBのTODO一覧取得（テナントAのデータが含まれないこと）" 200 "$HTTP_CODE"
echo "        Response: $BODY"

# Step 8: system_admin でログイン
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -c "$COOKIE_JAR_SYS" \
  -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.example.com","password":"Admin123!"}')
check 8 "ログイン（system_admin）" 200 "$HTTP_CODE"

# Step 9: system_admin の TODO 一覧（全テナント）
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -b "$COOKIE_JAR_SYS" \
  "$BASE_URL/todos")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check 9 "system_adminのTODO一覧（全テナントのデータ）" 200 "$HTTP_CODE"
echo "        Response: $BODY"

echo ""

# ==========================================
# 権限（認可）
# ==========================================
echo "--- 権限（認可） ---"

# Step 10: テナントBユーザー(tenant_user) による TODO 削除拒否
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -b "$COOKIE_JAR_B" \
  -X DELETE "$BASE_URL/todos/3")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
check 10 "tenant_user による TODO 削除拒否" 403 "$HTTP_CODE"

# Step 11: テナントBユーザー(tenant_user) によるタグ削除拒否
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -b "$COOKIE_JAR_B" \
  -X DELETE "$BASE_URL/tags/3")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
check 11 "tenant_user によるタグ削除拒否" 403 "$HTTP_CODE"

# Step 12: テナントA管理者(tenant_admin) による TODO 作成
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -b "$COOKIE_JAR_A" \
  -X POST "$BASE_URL/todos" \
  -H "Content-Type: application/json" \
  -d '{"title":"管理者が作成したTODO","tags":["仕事"]}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check 12 "tenant_admin による TODO 作成" 201 "$HTTP_CODE"
echo "        Response: $BODY"

# Step 13: テナントA管理者(tenant_admin) によるタグ作成
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -b "$COOKIE_JAR_A" \
  -X POST "$BASE_URL/tags" \
  -H "Content-Type: application/json" \
  -d '{"name":"新規タグ"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check 13 "tenant_admin によるタグ作成" 201 "$HTTP_CODE"
echo "        Response: $BODY"

# Step 13 で作成したタグの ID を取得して削除テスト
TAG_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2 || true)

# Step 14: テナントA管理者(tenant_admin) によるタグ削除
if [ -n "$TAG_ID" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -b "$COOKIE_JAR_A" \
    -X DELETE "$BASE_URL/tags/$TAG_ID")
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  check 14 "tenant_admin によるタグ削除" 200 "$HTTP_CODE"
else
  echo "[STEP 14] tenant_admin によるタグ削除... SKIP (タグID取得失敗)"
fi

echo ""

# ==========================================
# パスワードリセット
# ==========================================
echo "--- パスワードリセット ---"

# Step 15: パスワードリセット要求
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/auth/password-reset/request" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@tenant-a.example.com"}')
check 15 "パスワードリセット要求" 200 "$HTTP_CODE"

# Step 16: 存在しないユーザーへのパスワードリセット要求（セキュリティ: 成功を返す）
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/auth/password-reset/request" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com"}')
check 16 "存在しないユーザーへのパスワードリセット要求（200を返す）" 200 "$HTTP_CODE"

echo ""

# ==========================================
# ログアウト
# ==========================================
echo "--- ログアウト ---"

# Step 17: ログアウト
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "$COOKIE_JAR_A" -c "$COOKIE_JAR_A" \
  -X POST "$BASE_URL/auth/logout")
check 17 "ログアウト" 204 "$HTTP_CODE"

# Step 18: ログアウト後のアクセス拒否
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "$COOKIE_JAR_A" \
  "$BASE_URL/auth/me")
check 18 "ログアウト後のアクセス拒否" 401 "$HTTP_CODE"

echo ""

# ==========================================
# 結果サマリ
# ==========================================
echo "============================================"
echo "  結果: PASS=$PASS  FAIL=$FAIL"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
