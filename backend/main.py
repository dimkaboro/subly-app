from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from dotenv import load_dotenv


import os
import models
import schemas
from database import engine, SessionLocal

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Убираем старую строку и оставляем только этот блок:
raw_minutes = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
ACCESS_TOKEN_EXPIRE_MINUTES = int(raw_minutes) if raw_minutes else 1440

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


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# endpoint of login
@app.post("/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)): # Поменяли схему здесь
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Nesprávný e-mail nebo heslo")
    
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "username": user.username}