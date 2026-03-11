#!/bin/bash
#
# 全 API エンドポイント動作確認スクリプト
#
# 前提:
#   1. docker compose up -d で SQL Server が起動済み
#   2. yarn prisma migrate dev でマイグレーション済み
#   3. yarn prisma db seed でシードデータ投入済み
#   4. yarn start:dev でアプリケーション起動済み
#
# 使い方:
#   chmod +x scripts/verify-api.sh
#   ./scripts/verify-api.sh
#
# オプション:
#   BASE_URL=http://localhost:4000 ./scripts/verify-api.sh
#   VERBOSE=1 ./scripts/verify-api.sh   # レスポンスボディを常に表示
#

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
VERBOSE="${VERBOSE:-0}"
COOKIE_JAR=$(mktemp)
PASS=0
FAIL=0
SKIP=0

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

# ============================================================
# ユーティリティ
# ============================================================

# 色付き出力
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
RESET="\033[0m"

print_header() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════${RESET}"
  echo -e "${CYAN}  $1${RESET}"
  echo -e "${CYAN}═══════════════════════════════════════════════${RESET}"
}

print_section() {
  echo ""
  echo -e "${YELLOW}--- $1 ---${RESET}"
}

# HTTP リクエスト実行 + 結果チェック
# Usage: do_request <STEP> <DESCRIPTION> <EXPECTED_CODE> <METHOD> <PATH> [BODY]
do_request() {
  local step="$1"
  local description="$2"
  local expected_code="$3"
  local method="$4"
  local path="$5"
  local body="${6:-}"

  local curl_args=(
    -s
    -w "\n%{http_code}"
    -b "$COOKIE_JAR" -c "$COOKIE_JAR"
    -X "$method"
    "$BASE_URL$path"
  )

  if [ -n "$body" ]; then
    curl_args+=(-H "Content-Type: application/json" -d "$body")
  fi

  local response
  response=$(curl "${curl_args[@]}")
  local http_code
  http_code=$(echo "$response" | tail -1)
  local response_body
  response_body=$(echo "$response" | sed '$d')

  # 結果保持用（後続ステップで参照できるように）
  LAST_HTTP_CODE="$http_code"
  LAST_BODY="$response_body"

  if [ "$http_code" -eq "$expected_code" ]; then
    echo -e "  ${GREEN}✓${RESET} [STEP $step] $description (${http_code})"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${RESET} [STEP $step] $description (expected ${expected_code}, got ${http_code})"
    FAIL=$((FAIL + 1))
    # 失敗時は常にボディ表示
    echo "        Response: $response_body"
  fi

  if [ "$VERBOSE" = "1" ]; then
    echo "        Response: $response_body"
  fi
}

# JSON からフィールド値を抽出（jq なし環境対応）
extract_id() {
  echo "$1" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2
}

# ============================================================
# ヘルスチェック
# ============================================================

print_header "全 API エンドポイント動作確認"
echo "  BASE_URL: $BASE_URL"
echo "  VERBOSE:  $VERBOSE"

echo ""
echo -n "サーバー接続確認... "
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null | grep -q "^[2345]"; then
  echo -e "${GREEN}OK${RESET}"
else
  echo -e "${RED}FAIL${RESET}"
  echo "サーバーに接続できません。yarn start:dev が起動しているか確認してください。"
  exit 1
fi

# ============================================================
# 1. 認証 (Auth)
# ============================================================

print_section "認証 (POST /auth/login)"

do_request 1 "ログイン（テナントA管理者）" 200 POST "/auth/login" \
  '{"email":"admin@tenant-a.example.com","password":"Admin123!"}'

do_request 2 "ログイン失敗（パスワード誤り）" 401 POST "/auth/login" \
  '{"email":"admin@tenant-a.example.com","password":"wrong"}'

do_request 3 "ログイン失敗（バリデーション：空ボディ）" 400 POST "/auth/login" \
  '{}'

print_section "ユーザー情報 (GET /auth/me)"

do_request 4 "認証ユーザー情報取得" 200 GET "/auth/me"
echo "        User: $LAST_BODY"

print_section "トークンリフレッシュ (POST /auth/refresh)"

do_request 5 "トークンリフレッシュ" 200 POST "/auth/refresh"

# ============================================================
# 2. TODO CRUD
# ============================================================

print_section "TODO 一覧 (GET /todos)"

do_request 6 "TODO 一覧取得" 200 GET "/todos"
echo "        Count: $(echo "$LAST_BODY" | grep -o '"id"' | wc -l | tr -d ' ') 件"

print_section "TODO 作成 (POST /todos)"

do_request 7 "TODO 作成（タグ付き）" 201 POST "/todos" \
  '{"title":"curlから作成したTODO","tags":["仕事"]}'
TODO_ID=$(extract_id "$LAST_BODY")
echo "        Created ID: $TODO_ID"

do_request 8 "TODO 作成（タグなし）" 201 POST "/todos" \
  '{"title":"タグなしTODO"}'
TODO_ID_NOTAG=$(extract_id "$LAST_BODY")

do_request 9 "TODO 作成失敗（タイトル未指定）" 400 POST "/todos" \
  '{}'

do_request 10 "TODO 作成失敗（タイトル空文字）" 400 POST "/todos" \
  '{"title":""}'

print_section "TODO 詳細 (GET /todos/:id)"

if [ -n "$TODO_ID" ]; then
  do_request 11 "TODO 詳細取得" 200 GET "/todos/$TODO_ID"
  echo "        Todo: $LAST_BODY"
else
  echo -e "  ${YELLOW}○${RESET} [STEP 11] SKIP (TODO_ID 取得失敗)"
  SKIP=$((SKIP + 1))
fi

do_request 12 "TODO 詳細取得（存在しないID）" 404 GET "/todos/99999"

print_section "TODO 更新 (PATCH /todos/:id)"

if [ -n "$TODO_ID" ]; then
  do_request 13 "TODO タイトル更新" 200 PATCH "/todos/$TODO_ID" \
    '{"title":"更新されたTODO"}'
  echo "        Updated: $LAST_BODY"

  do_request 14 "TODO 完了フラグ更新" 200 PATCH "/todos/$TODO_ID" \
    '{"completed":true}'

  do_request 15 "TODO タグ差し替え" 200 PATCH "/todos/$TODO_ID" \
    '{"tags":["プライベート"]}'
  echo "        Tags updated: $LAST_BODY"
else
  echo -e "  ${YELLOW}○${RESET} [STEP 13-15] SKIP (TODO_ID 取得失敗)"
  SKIP=$((SKIP + 3))
fi

print_section "TODO 削除 (DELETE /todos/:id)"

if [ -n "$TODO_ID_NOTAG" ]; then
  do_request 16 "TODO 削除" 200 DELETE "/todos/$TODO_ID_NOTAG"
  echo "        Deleted: $LAST_BODY"
else
  echo -e "  ${YELLOW}○${RESET} [STEP 16] SKIP (TODO_ID 取得失敗)"
  SKIP=$((SKIP + 1))
fi

do_request 17 "TODO 削除（存在しないID）" 404 DELETE "/todos/99999"

# ============================================================
# 3. タグ CRUD
# ============================================================

print_section "タグ一覧 (GET /tags)"

do_request 18 "タグ一覧取得" 200 GET "/tags"
echo "        Count: $(echo "$LAST_BODY" | grep -o '"id"' | wc -l | tr -d ' ') 件"

print_section "タグ作成 (POST /tags)"

do_request 19 "タグ作成" 201 POST "/tags" \
  '{"name":"動作確認タグ"}'
TAG_ID=$(extract_id "$LAST_BODY")
echo "        Created ID: $TAG_ID"

do_request 20 "タグ作成失敗（名前未指定）" 400 POST "/tags" \
  '{}'

do_request 21 "タグ作成失敗（名前空文字）" 400 POST "/tags" \
  '{"name":""}'

do_request 22 "タグ作成失敗（名前重複）" 409 POST "/tags" \
  '{"name":"仕事"}'

print_section "タグ詳細 (GET /tags/:id)"

if [ -n "$TAG_ID" ]; then
  do_request 23 "タグ詳細取得" 200 GET "/tags/$TAG_ID"
  echo "        Tag: $LAST_BODY"
else
  echo -e "  ${YELLOW}○${RESET} [STEP 23] SKIP (TAG_ID 取得失敗)"
  SKIP=$((SKIP + 1))
fi

do_request 24 "タグ詳細取得（存在しないID）" 404 GET "/tags/99999"

print_section "タグ更新 (PATCH /tags/:id)"

if [ -n "$TAG_ID" ]; then
  do_request 25 "タグ名更新" 200 PATCH "/tags/$TAG_ID" \
    '{"name":"更新済みタグ"}'
  echo "        Updated: $LAST_BODY"
else
  echo -e "  ${YELLOW}○${RESET} [STEP 25] SKIP (TAG_ID 取得失敗)"
  SKIP=$((SKIP + 1))
fi

print_section "タグ削除 (DELETE /tags/:id)"

if [ -n "$TAG_ID" ]; then
  do_request 26 "タグ削除" 200 DELETE "/tags/$TAG_ID"
  echo "        Deleted: $LAST_BODY"
else
  echo -e "  ${YELLOW}○${RESET} [STEP 26] SKIP (TAG_ID 取得失敗)"
  SKIP=$((SKIP + 1))
fi

do_request 27 "タグ削除（存在しないID）" 404 DELETE "/tags/99999"

# ============================================================
# 4. テナント分離
# ============================================================

print_section "テナント分離確認"

# テナントA の TODO/タグ件数を記録
do_request 28 "テナントA の TODO 一覧" 200 GET "/todos"
TENANT_A_TODO_COUNT=$(echo "$LAST_BODY" | grep -o '"id"' | wc -l | tr -d ' ')

do_request 29 "テナントA のタグ一覧" 200 GET "/tags"
TENANT_A_TAG_COUNT=$(echo "$LAST_BODY" | grep -o '"id"' | wc -l | tr -d ' ')

# テナントB にログイン
do_request 30 "テナントB ユーザーでログイン" 200 POST "/auth/login" \
  '{"email":"user@tenant-b.example.com","password":"User123!"}'

do_request 31 "テナントB の TODO 一覧" 200 GET "/todos"
TENANT_B_TODO_COUNT=$(echo "$LAST_BODY" | grep -o '"id"' | wc -l | tr -d ' ')
echo "        テナントA: ${TENANT_A_TODO_COUNT}件 / テナントB: ${TENANT_B_TODO_COUNT}件"

do_request 32 "テナントB のタグ一覧" 200 GET "/tags"
TENANT_B_TAG_COUNT=$(echo "$LAST_BODY" | grep -o '"id"' | wc -l | tr -d ' ')
echo "        テナントA: ${TENANT_A_TAG_COUNT}件 / テナントB: ${TENANT_B_TAG_COUNT}件"

# ============================================================
# 5. 権限 (Authorization)
# ============================================================

print_section "権限確認（tenant_user の制限）"

# テナントB ユーザー（tenant_user）でのまま

do_request 33 "tenant_user による TODO 削除拒否" 403 DELETE "/todos/3"

do_request 34 "tenant_user によるタグ削除拒否" 403 DELETE "/tags/99999"

# テナントA管理者に戻る
do_request 35 "テナントA管理者で再ログイン" 200 POST "/auth/login" \
  '{"email":"admin@tenant-a.example.com","password":"Admin123!"}'

# ============================================================
# 6. パスワードリセット
# ============================================================

print_section "パスワードリセット"

do_request 36 "パスワードリセット要求" 200 POST "/auth/password-reset/request" \
  '{"email":"user@tenant-a.example.com"}'

do_request 37 "パスワードリセット要求（存在しないユーザー → 200を返す）" 200 POST "/auth/password-reset/request" \
  '{"email":"nonexistent@example.com"}'

do_request 38 "パスワードリセット確認（無効トークン）" 400 POST "/auth/password-reset/confirm" \
  '{"token":"invalid-token","password":"NewPass123!"}'

# ============================================================
# 7. 未認証アクセス
# ============================================================

print_section "未認証アクセス"

# Cookie なしのリクエスト用
do_request 39 "ログアウト" 204 POST "/auth/logout"

COOKIE_JAR_EMPTY=$(mktemp)
COOKIE_JAR_BAK="$COOKIE_JAR"
COOKIE_JAR="$COOKIE_JAR_EMPTY"

do_request 40 "未認証での TODO 一覧" 401 GET "/todos"
do_request 41 "未認証でのタグ一覧" 401 GET "/tags"
do_request 42 "未認証での /auth/me" 401 GET "/auth/me"

# Cookie jar を戻す
COOKIE_JAR="$COOKIE_JAR_BAK"
rm -f "$COOKIE_JAR_EMPTY"

# ============================================================
# 8. クリーンアップ（テストデータ削除）
# ============================================================

print_section "クリーンアップ"

# テナントA管理者で再ログイン
do_request 43 "クリーンアップ用ログイン" 200 POST "/auth/login" \
  '{"email":"admin@tenant-a.example.com","password":"Admin123!"}'

# Step 7 で作成した TODO を削除
if [ -n "$TODO_ID" ]; then
  do_request 44 "テストデータ削除（TODO）" 200 DELETE "/todos/$TODO_ID"
else
  echo -e "  ${YELLOW}○${RESET} [STEP 44] SKIP (TODO_ID なし)"
  SKIP=$((SKIP + 1))
fi

# ============================================================
# 結果サマリ
# ============================================================

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════${RESET}"
echo -e "  結果:  ${GREEN}PASS=${PASS}${RESET}  ${RED}FAIL=${FAIL}${RESET}  ${YELLOW}SKIP=${SKIP}${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════${RESET}"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
