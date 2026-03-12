.PHONY: run db

DB_PROVIDER := $(shell grep '^DATABASE_URL=' .env | head -1 | sed 's/DATABASE_URL="//' | sed 's/:.*//')

# アプリケーション起動
run:
	yarn start:dev

# DB コンソールログイン（.env の DATABASE_URL から自動判定）
db:
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
