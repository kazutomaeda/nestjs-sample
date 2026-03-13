.PHONY: db-login up rebuild db-up db-push db-seed

DB_PROVIDER := $(shell grep '^DATABASE_URL=' .env | head -1 | sed 's/DATABASE_URL="//' | sed 's/:.*//')

# Docker Compose 全サービス起動
up:
	docker compose up

# app コンテナをリビルド（yarn add 後に実行）
rebuild:
	docker compose up -d --build --renew-anon-volumes app

# DB 関連サービスのみ起動（mysql）
db-up:
	docker compose up -d mysql

# DB スキーマ反映（Docker 内で実行）
db-push: db-up
	docker compose exec app yarn prisma db push

# シードデータ投入（Docker 内で実行）
db-seed: db-up
	docker compose exec app yarn prisma db seed

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
