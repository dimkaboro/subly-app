from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext

import models
import schemas
from database import engine, SessionLocal

# Создаем таблицы в БД
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# 1. Настройка CORS (чтобы React не блокировался)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# 2. Настройка шифрования паролей (с правильным словом schemes)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

# 3. Подключение к БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. НАШ МАРШРУТ РЕГИСТРАЦИИ (который терялся и выдавал 404)
@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    
    # Проверка email
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Uživatel s tímto e-mailem již existuje")
    
    # Проверка никнейма
    db_username = db.query(models.User).filter(models.User.username == user.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Tato přezdívka je již obsazená")

    # Шифрование и сохранение в базу
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username, 
        email=user.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user