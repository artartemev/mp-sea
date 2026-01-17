# schemas.py
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# ... TelegramData ...
class TelegramData(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: Optional[int] = None
    hash: Optional[str] = None

# --- Схема для Изображений ---
class ListingImageBase(BaseModel):
    url: str

class ListingImage(ListingImageBase):
    id: UUID
    class Config:
        from_attributes = True

# --- НОВАЯ СХЕМА для публичной инфо о пользователе ---
class UserPublic(BaseModel):
    id: UUID
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    class Config:
        from_attributes = True

# --- Схемы для Объявлений ---
class Prices(BaseModel):
    USD: Optional[float] = None
    RUB: Optional[float] = None
    THB: Optional[float] = None

class ListingBase(BaseModel):
    title: str
    description: Optional[str] = None
    # price: float # Убираем, заменяем на prices

class ListingCreate(ListingBase):
    price: float
    currency: str = 'USD'


class Listing(ListingBase):
    id: UUID
    created_at: datetime
    prices: Prices
    main_image_url: Optional[str] = None # Только главное изображение
    seller: UserPublic
    category: Optional['Category'] = None # Добавляем категорию

    class Config:
        from_attributes = True

# --- Схемы для Категорий ---
class CategoryBase(BaseModel):
    name: str
    slug: str

class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# Обновляем Listing, чтобы он мог сериализовать вложенную Category
# Это нужно, чтобы FastAPI корректно формировал ответ
# Listing.model_rebuild() # В Pydantic v2 это делается автоматически при определении ForwardRef

# Новая схема для публичного каталога, более легковесная
class ListingPublic(ListingBase):
    id: UUID
    created_at: datetime
    prices: Prices
    main_image_url: Optional[str] = None
    seller: UserPublic
    category: Optional[Category] = None # Используем определенную выше Category

    class Config:
        from_attributes = True
