import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- БЛОК ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ ---
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.critical("FATAL ERROR: Переменная окружения DATABASE_URL не найдена!")
    raise ValueError("Переменная окружения DATABASE_URL не установлена")

# Проверяем и исправляем URL для SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    logger.info("INFO: URL был успешно преобразован для SQLAlchemy.")

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    logger.info("SUCCESS: Engine, SessionLocal и Base успешно сконфигурированы.")
except Exception as e:
    logger.critical(f"FATAL ERROR: Не удалось создать движок SQLAlchemy: {e}")
    raise

# --- КОНЕЦ БЛОКА ПОДКЛЮЧЕНИЯ ---


# --- ФУНКЦИЯ-ЗАВИСИМОСТЬ ДЛЯ FASTAPI ---
# Вот та самая функция, которую мы возвращаем на место
def get_db():
    """
    Эта функция-генератор создает сессию базы данных для каждого запроса.
    Она гарантирует, что сессия будет всегда закрыта после выполнения запроса,
    даже если произошла ошибка.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
