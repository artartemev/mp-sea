# main.py
import os
import shutil
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Depends, Response, UploadFile, File, Query
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

# ИСПРАВЛЕННЫЕ ИМПОРТЫ - используем относительные пути
from . import crud
from . import models
from . import security
from . import schemas
from .database import get_db, engine
from .seed import seed_data # Предполагается, что у вас есть seed.py в той же папке

# --- Lifespan для управления запуском и остановкой ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Выполняется при старте приложения для подготовки ресурсов,
    например, для создания таблиц в базе данных.
    """
    print("Приложение запускается, создаем таблицы в БД...")
    models.Base.metadata.create_all(bind=engine)
    print("Проверка и создание таблиц завершены.")
    yield
    # Код после yield выполнится при остановке приложения
    print("Приложение останавливается.")

# --- Инициализация приложения с Lifespan ---
app = FastAPI(
    lifespan=lifespan,
    title="Marketplace API",
    description="API для небольшой торговой площадки."
)

# --- Настройка статики и создание дефолтной категории ---

# --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
# Указываем Vercel использовать временную папку /tmp для загрузок
UPLOADS_DIR = "/tmp/uploads"
# --- КОНЕЦ ИСПРАВЛЕНИЯ ---

os.makedirs(UPLOADS_DIR, exist_ok=True)

# Создаем сессию только для одноразовой операции при старте
with Session(engine) as session:
    # Проверяем и создаем категорию "Разное", если ее нет
    default_category = session.query(models.Category).filter_by(slug="other").first()
    if not default_category:
        uncategorized = models.Category(id=1, name="Разное", slug="other")
        session.add(uncategorized)
        session.commit()
        print("Создана категория по умолчанию 'Разное'.")

# "Монтируем" папку uploads, чтобы файлы были доступны по URL
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


# --- Секретный эндпоинт для наполнения базы ---
@app.post("/api/seed-database", tags=["Admin"], summary="Заполнить БД тестовыми данными")
async def seed_database_endpoint(
    secret: str = Query(..., description="Секретный ключ для выполнения операции"),
    db: Session = Depends(get_db)
):
    """
    Заполняет базу данных тестовыми пользователями, категориями и объявлениями.
    Этот эндпоинт следует использовать только для разработки.
    """
    SEED_KEY_FROM_ENV = os.getenv("SEED_SECRET_KEY")

    if not SEED_KEY_FROM_ENV:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Секретный ключ (SEED_SECRET_KEY) не настроен на сервере."
        )

    if secret != SEED_KEY_FROM_ENV:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Неверный секретный ключ доступа."
        )

    try:
        seed_data(db)
        return {"message": "База данных успешно наполнена тестовыми данными!"}
    except Exception as e:
        # Логируем ошибку для отладки
        print(f"Ошибка при наполнении базы: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Произошла внутренняя ошибка при наполнении базы: {e}"
        )

# --- Тестовые эндпоинты для диагностики ---
@app.get("/api/test", tags=["Test"])
async def test_api():
    return {"status": "ok", "message": "API работает"}

@app.get("/api/db-test", tags=["Test"]) 
async def test_db(db: Session = Depends(get_db)):
    try:
        # Простой запрос к БД
        result = db.execute("SELECT 1").scalar()
        return {"database": "connected", "result": result}
    except Exception as e:
        return {"database": "error", "message": str(e)}

# --- Эндпоинты для объявлений (Listings) ---

@app.get("/api/listings", response_model=List[schemas.ListingPublic], tags=["Listings"], summary="Получить список объявлений")
async def read_listings(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    max_price: Optional[float] = None,
    q: Optional[str] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Публичный эндпоинт для получения списка объявлений с фильтрацией, поиском и сортировкой.
    """
    listings = crud.get_active_listings(db, skip=skip, limit=limit, category_slug=category, max_price=max_price, q=q, sort_by=sort_by)
    return listings

@app.get("/api/listings/{listing_id}", response_model=schemas.Listing, tags=["Listings"], summary="Получить одно объявление по ID")
async def read_listing(listing_id: UUID, db: Session = Depends(get_db)):
    """
    Публичный эндпоинт для получения полной информации об одном объявлении.
    """
    db_listing = crud.get_listing_by_id(db, listing_id=listing_id)
    if db_listing is None:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    return db_listing

@app.post("/api/listings/{listing_id}/upload-image", response_model=schemas.ListingImage, tags=["Listings"], summary="Загрузить изображение для объявления")
async def upload_listing_image(
    listing_id: UUID,
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Загружает изображение для указанного объявления. Требует авторизации.
    """
    db_listing = crud.get_listing_by_id(db, listing_id=listing_id)
    if db_listing is None:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if db_listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав для выполнения этого действия")

    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOADS_DIR, file_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/uploads/{file_name}"
    return crud.add_image_to_listing(db=db, listing_id=listing_id, image_url=image_url)

@app.delete("/api/listings/{listing_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Listings"], summary="Удалить изображение из объявления")
async def delete_listing_image_endpoint(
    listing_id: UUID,
    image_id: UUID,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Удаляет изображение из объявления. Требует авторизации.
    """
    db_listing = crud.get_listing_by_id(db, listing_id=listing_id)
    if not db_listing:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if db_listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    db_image = crud.get_listing_image_by_id(db, image_id=image_id)
    if not db_image or db_image.listing_id != listing_id:
        raise HTTPException(status_code=404, detail="Изображение не найдено или не принадлежит этому объявлению")

    image_path = os.path.join(UPLOADS_DIR, os.path.basename(db_image.url))
    if os.path.exists(image_path):
        try:
            os.remove(image_path)
        except OSError as e:
            print(f"Ошибка при удалении файла {image_path}: {e}")
            # Можно добавить логирование в более серьезном приложении

    crud.delete_listing_image(db=db, db_image=db_image)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- Добавьте сюда остальные ваши эндпоинты, если они есть ---
# Например, для аутентификации, получения объявлений пользователя и т.д.
