# generate_sql.py
from sqlalchemy import create_engine
from sqlalchemy.schema import CreateTable
import models

# ИСПОЛЬЗУЕМ БОЛЕЕ ПРОСТОЙ URL БЕЗ ПОРТА
DUMMY_DATABASE_URL = "postgresql://user:password@host/database"
engine = create_engine(DUMMY_DATABASE_URL)

print("-- SQL команды для создания всех таблиц --")

# Проходим по всем таблицам, определенным в ваших моделях
for table in models.Base.metadata.sorted_tables:
    # Генерируем команду CREATE TABLE для диалекта PostgreSQL
    create_table_sql = CreateTable(table).compile(dialect=engine.dialect)
    print(f"\n-- Таблица: {table.name}")
    print(f"{create_table_sql};")

print("\n-- SQL команды сгенерированы. Скопируйте все, что выше, и выполните в Neon. --")