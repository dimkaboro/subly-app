from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Адрес нашей базы данных
# Мы берем эти данные (user, password, db) из твоего docker-compose.yml
# Если ты ничего не менял в докере, то оставляй как есть.
URL_DATABASE = "postgresql://user:password@localhost:5432/subscriptions_db"

# 2. Создаем "движок" (Engine)
# Это сердце подключения. Через него запросы летят в базу.
engine = create_engine(URL_DATABASE)

# 3. Создаем фабрику сессий
# Сессия — это временное соединение. Открыли, спросили данные, закрыли.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Базовый класс (Base)
# От этого класса мы будем наследовать все наши таблицы (User, Subscription и т.д.)
Base = declarative_base()