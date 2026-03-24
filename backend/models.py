from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base # Убедись, что импорт базы правильный

# Твой класс пользователя (уже есть, просто добавим одну строчку)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    telegram_chat_id = Column(String, nullable=True, unique=True) # То, что мы обсуждали для бота

    # 👇 НОВАЯ СТРОКА: Связь с подписками (один ко многим)
    subscriptions = relationship("Subscription", back_populates="owner")


# 👇 НОВЫЙ КЛАСС: Таблица подписок
class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)          # Название (Netflix)
    price = Column(Float)                      # Цена (300)
    currency = Column(String, default="CZK")   # Валюта (CZK)
    cycle = Column(String)                     # Периодичность (Měsíčně)
    next_payment = Column(Date)                # Дата следующего платежа
    
    # Связь с таблицей пользователей
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="subscriptions")