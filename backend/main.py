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

raw_minutes = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
ACCESS_TOKEN_EXPIRE_MINUTES = int(raw_minutes) if raw_minutes else 1440

# Создаем таблицы в БД
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# 1. Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# 2. Настройка шифрования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 3. Подключение к БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. Маршрут регистрации
@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Проверка email
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Uživatel s tímto e-mailem již existuje")
    
    # Проверка никнейма
    db_username = db.query(models.User).filter(models.User.username == user.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Tato přezdívka је již obsazená")

    # Шифрование и сохранение
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username, 
        email=user.email,
        password=hashed_password
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

# 5. Маршрут авторизации (Login)
@app.post("/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # Ищем пользователя в базе
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    
    # Проверяем пользователя и пароль (исправлено на user.password)
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Nesprávný e-mail nebo heslo"
        )
    
    token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "username": user.username
    }