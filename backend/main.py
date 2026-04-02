from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta, date
from jose import JWTError, jwt
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import os
import asyncio
import httpx
import logging

import models
import schemas
from database import engine, SessionLocal
from telegram_bot import run_bot

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

raw_minutes = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
ACCESS_TOKEN_EXPIRE_MINUTES = int(raw_minutes) if raw_minutes else 1440

# Создаем таблицы в БД
models.Base.metadata.create_all(bind=engine)

# ─── Telegram notification helpers ──────────────────────────────────────────

async def send_telegram_message(chat_id: str, text: str) -> None:
    """Send a message via Telegram Bot API."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})
            if resp.status_code != 200:
                logger.warning(f"Telegram send failed for {chat_id}: {resp.text}")
    except Exception as e:
        logger.error(f"Telegram HTTP error: {e}")


NOTIFICATIONS_I18N = {
    "cs": {
        "3_days": "⏰ <b>Subly: připomenutí platby</b>\n\nZa <b>3 dny</b> proběhne platba za:\n📌 <b>{name}</b> — {price} {currency}\n📅 Datum platby: {date}",
        "1_day": "🚨 <b>Subly: zítra je platba!</b>\n\nZítra proběhne platba za:\n📌 <b>{name}</b> — {price} {currency}\n📅 Datum platby: {date}"
    },
    "en": {
        "3_days": "⏰ <b>Subly: Payment Reminder</b>\n\nIn <b>3 days</b>, you have a payment for:\n📌 <b>{name}</b> — {price} {currency}\n📅 Date: {date}",
        "1_day": "🚨 <b>Subly: Payment Tomorrow!</b>\n\nTomorrow, you have a payment for:\n📌 <b>{name}</b> — {price} {currency}\n📅 Date: {date}"
    },
    "ru": {
        "3_days": "⏰ <b>Subly: напоминание о платеже</b>\n\nЧерез <b>3 дня</b> будет списана оплата за:\n📌 <b>{name}</b> — {price} {currency}\n📅 Дата платежа: {date}",
        "1_day": "🚨 <b>Subly: завтра платёж!</b>\n\nЗавтра будет списана оплата за:\n📌 <b>{name}</b> — {price} {currency}\n📅 Дата платежа: {date}"
    },
    "ukr": {
        "3_days": "⏰ <b>Subly: нагадування про платіж</b>\n\nЧерез <b>3 дні</b> буде списано оплату за:\n📌 <b>{name}</b> — {price} {currency}\n📅 Дата платежу: {date}",
        "1_day": "🚨 <b>Subly: завтра платіж!</b>\n\nЗавтра буде списано оплату за:\n📌 <b>{name}</b> — {price} {currency}\n📅 Дата платежу: {date}"
    }
}

async def check_upcoming_payments() -> None:
    """Daily job: notify users about subscriptions due in 1 or 3 days."""
    db = SessionLocal()
    try:
        today = date.today()
        users = db.query(models.User).filter(models.User.telegram_chat_id.isnot(None)).all()
        logger.info(f"[Scheduler] Checking payments for {len(users)} linked users...")

        for user in users:
            # 1. Fetch user's language setting
            lang_setting = db.query(models.TelegramSettings).filter(models.TelegramSettings.chat_id == user.telegram_chat_id).first()
            user_lang = lang_setting.language if lang_setting else "cs"

            for sub in user.subscriptions:
                if not sub.nextPayment:
                    continue
                try:
                    payment_date = datetime.strptime(sub.nextPayment, "%Y-%m-%d").date()
                except ValueError:
                    continue

                days_left = (payment_date - today).days

                formatted_date = payment_date.strftime('%d.%m.%Y')

                if days_left == 3:
                    template = NOTIFICATIONS_I18N.get(user_lang, NOTIFICATIONS_I18N["cs"])["3_days"]
                    msg = template.format(name=sub.name, price=sub.price, currency=sub.currency, date=formatted_date)
                    await send_telegram_message(user.telegram_chat_id, msg)
                    logger.info(f"  Sent 3-day reminder ({user_lang}) to {user.username} for {sub.name}")

                elif days_left == 1:
                    template = NOTIFICATIONS_I18N.get(user_lang, NOTIFICATIONS_I18N["cs"])["1_day"]
                    msg = template.format(name=sub.name, price=sub.price, currency=sub.currency, date=formatted_date)
                    await send_telegram_message(user.telegram_chat_id, msg)
                    logger.info(f"  Sent 1-day reminder ({user_lang}) to {user.username} for {sub.name}")
    finally:
        db.close()


# ─── FastAPI lifespan (startup / shutdown) ───────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    # 1. Start Telegram bot in background
    bot_task = asyncio.create_task(run_bot())

    # 2. Start APScheduler — runs check_upcoming_payments every day at 09:00
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        check_upcoming_payments,
        trigger="cron",
        hour=9,
        minute=0,
        id="daily_payment_check",
        replace_existing=True
    )
    scheduler.start()
    logger.info("✅ APScheduler started — daily check at 09:00")

    yield  # App is running

    # --- Shutdown ---
    scheduler.shutdown(wait=False)
    bot_task.cancel()
    try:
        await bot_task
    except asyncio.CancelledError:
        pass
    logger.info("🛑 Scheduler and bot stopped.")


app = FastAPI(lifespan=lifespan)

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

# 3.1 OAuth2 Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nesprávný token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

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

# 6. Получить подписки текущего пользователя
@app.get("/api/subscriptions", response_model=list[schemas.SubscriptionResponse])
def get_subscriptions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return current_user.subscriptions

# 7. Создать подписку
@app.post("/api/subscriptions", response_model=schemas.SubscriptionResponse)
def create_subscription(sub: schemas.SubscriptionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_sub = models.Subscription(
        name=sub.name,
        price=sub.price,
        currency=sub.currency,
        cycle=sub.cycle,
        nextPayment=sub.nextPayment,
        user_id=current_user.id
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

# 8. Удалить подписку
@app.delete("/api/subscriptions/{sub_id}")
def delete_subscription(sub_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sub_query = db.query(models.Subscription).filter(
        models.Subscription.id == sub_id, 
        models.Subscription.user_id == current_user.id
    )
    sub = sub_query.first()
    if not sub:
        raise HTTPException(status_code=404, detail="Předplatné nebylo nalezeno")
    
    sub_query.delete(synchronize_session=False)
    db.commit()
    return {"detail": "Smazáno úspěšně"}

# 9. Обновить подписку
@app.put("/api/subscriptions/{sub_id}", response_model=schemas.SubscriptionResponse)
def update_subscription(sub_id: int, sub_data: schemas.SubscriptionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sub = db.query(models.Subscription).filter(
        models.Subscription.id == sub_id,
        models.Subscription.user_id == current_user.id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Předplatné nebylo nalezeno")
    
    sub.name = sub_data.name
    sub.price = sub_data.price
    sub.currency = sub_data.currency
    sub.cycle = sub_data.cycle
    sub.nextPayment = sub_data.nextPayment
    
    db.commit()
    db.refresh(sub)
    return sub

# ============ НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ ============

# 10. Получить профиль текущего пользователя
@app.get("/api/me", response_model=schemas.UserProfileResponse)
def get_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

# 11. Изменить email
@app.put("/api/me/email")
def change_email(data: schemas.ChangeEmail, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Проверяем текущий пароль
    if not verify_password(data.password, current_user.password):
        raise HTTPException(status_code=400, detail="Nesprávné heslo")
    
    # Проверяем уникальность нового email
    existing = db.query(models.User).filter(models.User.email == data.new_email).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="Tento e-mail je již používán")
    
    current_user.email = data.new_email
    db.commit()
    db.refresh(current_user)
    
    # Выпускаем новый токен с новым email
    new_token = create_access_token(data={"sub": current_user.email})
    
    return {"detail": "E-mail úspěšně změněn", "access_token": new_token, "email": current_user.email}

# 12. Изменить пароль
@app.put("/api/me/password")
def change_password(data: schemas.ChangePassword, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Проверяем текущий пароль
    if not verify_password(data.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Nesprávné aktuální heslo")
    
    # Хешируем и сохраняем новый пароль
    current_user.password = get_password_hash(data.new_password)
    db.commit()
    
    return {"detail": "Heslo úspěšně změněno"}

# 13. Привязать Telegram
@app.post("/api/me/telegram")
def link_telegram(data: schemas.TelegramLink, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.telegram_chat_id = data.telegram_chat_id
    db.commit()
    db.refresh(current_user)
    
    return {"detail": "Telegram úspěšně propojen", "telegram_chat_id": current_user.telegram_chat_id}

# 14. Отвязать Telegram
@app.delete("/api/me/telegram")
def unlink_telegram(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.telegram_chat_id = None
    db.commit()
    
    return {"detail": "Telegram odpojen"}