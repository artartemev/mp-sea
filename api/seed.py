# seed.py
from sqlalchemy.orm import Session
from . import models
import uuid

def seed_data(db: Session):
    """
    Заполняет базу данных тестовыми данными
    """
    
    # Создаем тестового пользователя
    test_user = models.User(
        telegram_id=123456789,
        telegram_username="testuser",
        full_name="Test User",
        avatar_url=None
    )
    db.add(test_user)
    db.flush()  # Получить ID пользователя
    
    # Создаем дополнительные категории
    categories = [
        {"name": "Электроника", "slug": "electronics"},
        {"name": "Одежда", "slug": "clothing"},
        {"name": "Дом и сад", "slug": "home-garden"},
        {"name": "Транспорт", "slug": "transport"},
    ]
    
    for cat_data in categories:
        existing_cat = db.query(models.Category).filter_by(slug=cat_data["slug"]).first()
        if not existing_cat:
            category = models.Category(**cat_data)
            db.add(category)
    
    db.flush()  # Получить ID категорий
    
    # Получаем ID категории "Электроника"
    electronics_cat = db.query(models.Category).filter_by(slug="electronics").first()
    
    # Создаем тестовые объявления
    test_listings = [
        {
            "title": "iPhone 15 Pro",
            "description": "Отличное состояние, все документы",
            "price": 1200.00,
            "owner_id": test_user.id,
            "category_id": electronics_cat.id if electronics_cat else 1
        },
        {
            "title": "MacBook Air M2",
            "description": "Почти новый, гарантия",
            "price": 1500.00,
            "owner_id": test_user.id,
            "category_id": electronics_cat.id if electronics_cat else 1
        },
        {
            "title": "Sony PlayStation 5",
            "description": "В коробке, все аксессуары",
            "price": 600.00,
            "owner_id": test_user.id,
            "category_id": electronics_cat.id if electronics_cat else 1
        }
    ]
    
    for listing_data in test_listings:
        listing = models.Listing(**listing_data)
        db.add(listing)
    
    db.commit()
    print("Тестовые данные успешно добавлены!")
