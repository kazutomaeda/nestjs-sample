#!/bin/bash
set -euo pipefail

VALID_PROVIDERS="sqlserver postgresql mysql sqlite"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SCHEMAS_DIR="$PROJECT_DIR/prisma/schemas"
TARGET="$PROJECT_DIR/prisma/schema.prisma"

usage() {
  echo "Usage: $0 <provider>"
  echo ""
  echo "Supported providers: $VALID_PROVIDERS"
  echo ""
  echo "Example:"
  echo "  $0 postgresql"
  exit 1
}

if [ $# -ne 1 ]; then
  usage
fi

PROVIDER="$1"

# Validate provider
if ! echo "$VALID_PROVIDERS" | grep -qw "$PROVIDER"; then
  echo "Error: Unknown provider '$PROVIDER'"
  echo "Supported providers: $VALID_PROVIDERS"
  exit 1
fi

SOURCE="$SCHEMAS_DIR/schema.$PROVIDER.prisma"

if [ ! -f "$SOURCE" ]; then
  echo "Error: Schema file not found: $SOURCE"
  exit 1
fi

echo "Switching to $PROVIDER..."
cp "$SOURCE" "$TARGET"
echo "Copied $SOURCE -> $TARGET"

echo "Running prisma generate..."
cd "$PROJECT_DIR"
npx prisma generate

echo "Done! Provider switched to '$PROVIDER'."
echo "Don't forget to update DATABASE_URL in .env for $PROVIDER."
