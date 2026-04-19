from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# URL pro připojení k databázi (bere se z env nebo fallback na localhost)
URL_DATABASE = os.getenv("DATABASE_URL", "postgresql://user:password@127.0.0.1:5432/subscriptions_db")

# Engine — hlavní spojení s databází
engine = create_engine(URL_DATABASE)

# Továrna na session (dočasné připojení pro dotazy)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Základní třída pro všechny ORM modely
Base = declarative_base()