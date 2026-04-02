from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # Вот она!
    email = Column(String, unique=True, index=True)
    password = Column(String)
    telegram_chat_id = Column(String, nullable=True, default=None)

    subscriptions = relationship("Subscription", back_populates="owner")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Integer)
    currency = Column(String, default="CZK")
    cycle = Column(String, default="Měsíčně")
    nextPayment = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="subscriptions")

class TelegramSettings(Base):
    __tablename__ = "telegram_settings"

    chat_id = Column(String, primary_key=True, index=True)
    language = Column(String, default="cs")

class NotificationSettings(Base):
    __tablename__ = "notification_settings"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    notify_email = Column(Boolean, default=True)
    notify_telegram = Column(Boolean, default=True)
    notify_intervals = Column(String, default="3d,1d") # comma-separated list like 14d,7d,3d,1d,12h,3h,1h
    notify_language = Column(String, default="cs")

    user = relationship("User", backref="notification_settings")