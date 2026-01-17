# crud.py
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from . import models  # Исправленный импорт
from . import schemas  # Исправленный импорт

# --- Функции для User ---
def get_user_by_id(db: Session, user_id: UUID):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_or_create_user(db: Session, user_data: schemas.TelegramData):
    user = db.query(models.User).filter(models.User.telegram_id == user_data.id).first()
    if user:
        return user
    full_name = f"{user_data.first_name} {user_data.last_name}" if user_data.last_name else user_data.first_name
    new_user = models.User(
        telegram_id=user_data.id,
        telegram_username=user_data.username,
        full_name=full_name,
        avatar_url=user_data.photo_url
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

from sqlalchemy import or_, func as sql_func

# --- Функции для Listing ---

# Conversion rates
RATES = {
    'USD': {'RUB': 90.0, 'THB': 35.0, 'USD': 1.0},
    'RUB': {'USD': 1/90.0, 'THB': 35.0/90.0, 'RUB': 1.0},
    'THB': {'USD': 1/35.0, 'RUB': 90.0/35.0, 'THB': 1.0},
}

def calculate_prices(price: float, currency: str) -> schemas.Prices:
    """Calculates prices in all available currencies defensively."""
    if price is None or currency is None or currency not in RATES:
        return schemas.Prices(USD=None, RUB=None, THB=None)

    try:
        price_float = float(price)

        # This logic assumes we convert from the listing's currency to a common base (USD)
        # and then to other currencies. The original logic was correct.
        base_price_in_usd = price_float
        if currency == 'RUB':
            base_price_in_usd = price_float / RATES['USD']['RUB']
        elif currency == 'THB':
            base_price_in_usd = price_float / RATES['USD']['THB']

        # Now, calculate all prices from the USD base
        return schemas.Prices(
            USD=base_price_in_usd,
            RUB=base_price_in_usd * RATES['USD']['RUB'],
            THB=base_price_in_usd * RATES['USD']['THB'],
        )
    except (ValueError, TypeError, ZeroDivisionError):
        # Return null prices if any calculation fails
        return schemas.Prices(USD=None, RUB=None, THB=None)


def get_active_listings(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category_slug: str = None,
    max_price: float = None,
    q: str = None,
    sort_by: str = None  # e.g., 'price_asc', 'price_desc', 'date_asc', 'date_desc'
):
    """
    Получает список активных объявлений с возможностью фильтрации, поиска и сортировки.
    """
    query = db.query(models.Listing).options(joinedload(models.Listing.category)).filter(models.Listing.status == models.ListingStatus.active)

    # Фильтрация по категории
    if category_slug:
        query = query.join(models.Category).filter(models.Category.slug == category_slug)

    # Фильтрация по максимальной цене
    if max_price is not None:
        query = query.filter(models.Listing.price <= max_price)

    # Поиск по названию и описанию
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                models.Listing.title.ilike(search_term),
                models.Listing.description.ilike(search_term)
            )
        )

    # Сортировка
    if sort_by:
        if sort_by == 'price_asc':
            query = query.order_by(models.Listing.price.asc())
        elif sort_by == 'price_desc':
            query = query.order_by(models.Listing.price.desc())
        elif sort_by == 'date_desc': # По умолчанию новые сначала
            query = query.order_by(models.Listing.created_at.desc())
        elif sort_by == 'date_asc':
            query = query.order_by(models.Listing.created_at.asc())
        # Можно добавить другие опции сортировки
    else:
        # Сортировка по умолчанию, если не указана
        query = query.order_by(models.Listing.created_at.desc())

    listings = query.offset(skip).limit(limit).all()

    # Загрузка основного изображения для каждого объявления
    # Этот подход (N+1 запрос для изображений) не оптимален для большого количества объявлений.
    # В идеале, это можно оптимизировать через joinedload или subqueryload, если бы main_image_url был частью модели Listing
    # или если бы мы всегда выбирали первое изображение по display_order.
    # Пока оставим так для совместимости с текущей структурой данных.
    for listing in listings:
        try:
            first_image = db.query(models.ListingImage).filter(models.ListingImage.listing_id == listing.id).order_by(models.ListingImage.display_order).first()
            listing.main_image_url = first_image.url if first_image else None
            listing.prices = calculate_prices(listing.price, listing.currency)
            # Категория теперь должна быть загружена через joinedload(models.Listing.category) в основном запросе.
        except Exception as e:
            # Log the error and skip the listing
            print(f"Error processing listing {listing.id}: {e}")
            listing.prices = schemas.Prices(USD=None, RUB=None, THB=None)


    return listings

def get_user_listings(db: Session, user_id: UUID):
    return db.query(models.Listing).filter(models.Listing.owner_id == user_id).all()

def create_user_listing(db: Session, listing: schemas.ListingCreate, user_id: UUID):
    listing_data = listing.model_dump()
    listing_data['status'] = 'active'
    # currency is now passed from the schema
    listing_data['category_id'] = 1 # default category
    db_listing = models.Listing(**listing_data, owner_id=user_id)
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)
    return db_listing

def update_user_listing(db: Session, db_listing: models.Listing, listing_data: schemas.ListingCreate):
    """Обновляет поля существующего объявления."""
    update_data = listing_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_listing, key, value)
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)
    return db_listing

def delete_user_listing(db: Session, db_listing: models.Listing):
    """Удаляет объявление из базы данных."""
    db.delete(db_listing)
    db.commit()

def get_listing_by_id(db: Session, listing_id: UUID):
    """Получает одно объявление по его ID с предзагрузкой продавца и картинок."""
    listing = db.query(models.Listing).options(
        joinedload(models.Listing.seller),
        joinedload(models.Listing.images)
    ).filter(models.Listing.id == listing_id).first()

    if listing:
        try:
            listing.prices = calculate_prices(listing.price, listing.currency)
        except Exception as e:
            print(f"Error processing listing {listing.id}: {e}")
            listing.prices = schemas.Prices(USD=None, RUB=None, THB=None)

    return listing

# --- Функции для ListingImage ---

def add_image_to_listing(db: Session, listing_id: UUID, image_url: str):
    """Добавляет URL изображения к объявлению."""
    db_image = models.ListingImage(listing_id=listing_id, url=image_url)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

def get_listing_image_by_id(db: Session, image_id: UUID):
    """Получает изображение по его ID."""
    return db.query(models.ListingImage).filter(models.ListingImage.id == image_id).first()

def delete_listing_image(db: Session, db_image: models.ListingImage):
    """Удаляет изображение из базы данных."""
    db.delete(db_image)
    db.commit()
