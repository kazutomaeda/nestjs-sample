.PHONY: setup db-login up rebuild db-up db-push db-seed db-generate

DB_PROVIDER := $(shell grep '^DATABASE_URL=' .env | head -1 | sed 's/DATABASE_URL="//' | sed 's/:.*//')

# 初回セットアップ（clone 後に一度だけ実行）
setup:
	@test -f .env || cp .env.example .env && echo "✔ .env created"
	docker compose up -d
	@echo "⏳ Waiting for MySQL to be ready..."
	@until docker compose exec mysql mysqladmin ping -uroot -ppassword --silent 2>/dev/null; do sleep 1; done
	@echo "✔ MySQL is ready"
	docker compose exec app yarn prisma db push
	docker compose exec app yarn prisma generate
	docker compose exec app yarn prisma db seed
	@echo ""
	@echo "✅ Setup complete!"
	@echo "   Swagger UI: http://localhost:3002/api"
	@echo "   Mailpit:    http://localhost:8025"
	@echo "   MinIO:      http://localhost:9003"

# Docker Compose 全サービス起動
up:
	docker compose up

# app コンテナをリビルド（yarn add 後に実行）
rebuild:
	docker compose up -d --build --renew-anon-volumes app

# DB 関連サービスのみ起動（mysql）
db-up:
	docker compose up -d mysql

# DB スキーマ反映
db-push: db-up
	docker compose run --rm --no-deps -e DATABASE_URL="mysql://root:password@mysql:3306/nestjs_sample" app yarn prisma db push

# Prisma Client 再生成（スキーマ変更後に実行）
db-generate:
	docker compose exec app yarn prisma generate

# シードデータ投入
db-seed: db-up
	docker compose run --rm --no-deps -e DATABASE_URL="mysql://root:password@mysql:3306/nestjs_sample" app yarn prisma db seed

# DB コンソールログイン（.env の DATABASE_URL から自動判定）
db-login: db-up
ifeq ($(DB_PROVIDER),sqlserver)
	docker exec -it nestjs-sample-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd' -d nestjs_sample -C
else ifeq ($(DB_PROVIDER),mysql)
	docker exec -it nestjs-sample-mysql mysql -uroot -ppassword nestjs_sample
else ifeq ($(DB_PROVIDER),postgresql)
	docker exec -it nestjs-sample-postgresql psql -U postgres nestjs_sample
else ifeq ($(DB_PROVIDER),file)
	@echo "SQLite: ファイルベースのためコンソールログインは不要です"
else
	@echo "未対応の DB プロバイダ: $(DB_PROVIDER)"
endif
