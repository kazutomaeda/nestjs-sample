.PHONY: run db

# アプリケーション起動
run:
	yarn start:dev

# SQL Server コンソールログイン
db:
	docker exec -it nestjs-sample-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd' -d nestjs_sample -C
