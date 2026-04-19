from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta, date
import random
import string
import calendar
from jose import JWTError, jwt
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import os
import asyncio
import httpx
import logging
import smtplib
from email.message import EmailMessage

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

# (Таблицы теперь создаются и мигрируются через Alembic)
# models.Base.metadata.create_all(bind=engine)

# ─── Telegram & Email notification helpers ─────────────────────────────────

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

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))

def send_email_message(to_email: str, subject: str, body: str) -> None:
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.info(f"📧 [MOCK EMAIL] To: {to_email} | Subject: {subject}\n{body}\n")
        return
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg["Subject"] = subject
        msg["From"] = f"Subly <{SMTP_EMAIL}>"
        msg["To"] = to_email

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"📧 Sent email to {to_email}")
    except Exception as e:
        logger.error(f"Email send error: {e}")


NOTIFICATIONS_I18N = {
    "cs": {
        "reminder": "⏰ <b>Subly: připomenutí platby</b>\n\nZa <b>{time_str}</b> proběhne platba za:\n📌 <b>{name}</b> — {price} {currency}\n📅 Datum platby: {date}",
        "times": {"14d": "14 dní", "7d": "7 dní", "3d": "3 dny", "1d": "1 den (zítra)", "12h": "12 hodin", "3h": "3 hodiny", "1h": "1 hodinu"}
    },
    "en": {
        "reminder": "⏰ <b>Subly: Payment Reminder</b>\n\nIn <b>{time_str}</b>, you have a payment for:\n📌 <b>{name}</b> — {price} {currency}\n📅 Date: {date}",
        "times": {"14d": "14 days", "7d": "7 days", "3d": "3 days", "1d": "1 day (tomorrow)", "12h": "12 hours", "3h": "3 hours", "1h": "1 hour"}
    },
    "ru": {
        "reminder": "⏰ <b>Subly: напоминание о платеже</b>\n\nЧерез <b>{time_str}</b> будет списана оплата за:\n📌 <b>{name}</b> — {price} {currency}\n📅 Дата платежа: {date}",
        "times": {"14d": "14 дней", "7d": "7 дней", "3d": "3 дня", "1d": "1 день (завтра)", "12h": "12 часов", "3h": "3 часа", "1h": "1 час"}
    },
    "ukr": {
        "reminder": "⏰ <b>Subly: нагадування про платіж</b>\n\nЧерез <b>{time_str}</b> буде списано оплату за:\n📌 <b>{name}</b> — {price} {currency}\n📅 Дата платежу: {date}",
        "times": {"14d": "14 днів", "7d": "7 днів", "3d": "3 дні", "1d": "1 день (завтра)", "12h": "12 годин", "3h": "3 години", "1h": "1 годину"}
    }
}

async def check_upcoming_payments() -> None:
    """Hourly job: notify users based on their settings."""
    db = SessionLocal()
    try:
        now = datetime.now()
        users = db.query(models.User).all()
        logger.info(f"[Scheduler] Checking payments for {len(users)} users (Hourly check)...")

        for user in users:
            # Get notification settings
            if user.notification_settings:
                user_notifs = user.notification_settings[0]
            else:
                user_notifs = models.NotificationSettings(notify_email=True, notify_telegram=True, notify_intervals="3d,1d")
            
            intervals = user_notifs.notify_intervals.split(",")

            # Используем язык из настроек уведомлений
            user_lang = user_notifs.notify_language if hasattr(user_notifs, 'notify_language') and user_notifs.notify_language else "cs"

            for sub in user.subscriptions:
                if not sub.nextPayment:
                    continue
                try:
                    # Treat payment_date as 00:00:00 of that day
                    payment_date = datetime.strptime(sub.nextPayment, "%Y-%m-%d")
                except ValueError:
                    continue

                # --- АВТО-ПРОДЛЕНИЕ ПОДПИСКИ ---
                # Если дата платежа уже прошла относительно текущего дня, сдвигаем её
                if payment_date.date() < now.date():
                    while payment_date.date() < now.date():
                        if sub.cycle == "Měsíčně":
                            month = payment_date.month - 1 + 1
                            year = payment_date.year + month // 12
                            month = month % 12 + 1
                            day = min(payment_date.day, calendar.monthrange(year, month)[1])
                            payment_date = payment_date.replace(year=year, month=month, day=day)
                        elif sub.cycle == "Ročně":
                            payment_date = payment_date.replace(year=payment_date.year + 1)
                        else:
                            # Если цикл неизвестен, не зацикливаемся
                            break 
                    
                    sub.nextPayment = payment_date.strftime("%Y-%m-%d")
                    db.commit()
                    logger.info(f"[Scheduler] Auto-rolled over '{sub.name}' for user {user.email} to {sub.nextPayment}")
                # -------------------------------

                delta = payment_date - now
                total_hours = round(delta.total_seconds() / 3600)

                matched_interval = None
                if "14d" in intervals and total_hours == 14 * 24: matched_interval = "14d"
                elif "7d" in intervals and total_hours == 7 * 24: matched_interval = "7d"
                elif "3d" in intervals and total_hours == 3 * 24: matched_interval = "3d"
                elif "1d" in intervals and total_hours == 24: matched_interval = "1d"
                elif "12h" in intervals and total_hours == 12: matched_interval = "12h"
                elif "3h" in intervals and total_hours == 3: matched_interval = "3h"
                elif "1h" in intervals and total_hours == 1: matched_interval = "1h"

                # Check if it triggers now
                if matched_interval:
                    formatted_date = payment_date.strftime('%d.%m.%Y')
                    t_data = NOTIFICATIONS_I18N.get(user_lang, NOTIFICATIONS_I18N["cs"])
                    time_str = t_data["times"][matched_interval]
                    msg_body = t_data["reminder"].format(time_str=time_str, name=sub.name, price=sub.price, currency=sub.currency, date=formatted_date)
                    subject = f"Subly: {sub.name} - {time_str}"
                    
                    if user_notifs.notify_telegram and user.telegram_chat_id:
                        await send_telegram_message(user.telegram_chat_id, msg_body)
                    
                    if user_notifs.notify_email and user.email:
                        # strip html tags for simple text email
                        import re
                        plain_body = re.sub('<[^<]+?>', '', msg_body)
                        send_email_message(user.email, subject, plain_body)
    finally:
        db.close()


# ─── FastAPI lifespan (startup / shutdown) ───────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    # 1. Start Telegram bot in background
    bot_task = asyncio.create_task(run_bot())

    # 2. Start APScheduler — runs check_upcoming_payments at the start of every hour (00, 01, 02...)
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        check_upcoming_payments,
        trigger="cron",
        minute=0,
        id="hourly_payment_check",
        replace_existing=True
    )
    scheduler.start()
    logger.info("✅ APScheduler started — hourly check at minute 0")

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

# ─── Email Verification Helpers ───────────────────────────────────────────────

def generate_verification_code() -> str:
    """Generate a random 6-digit numeric code."""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(to_email: str, code: str) -> None:
    """Send verification code email."""
    subject = "Subly – ověření e-mailu / Email Verification"
    body = (
        f"Váš ověřovací kód pro Subly je: {code}\n"
        f"Your Subly verification code is: {code}\n\n"
        f"Kód je platný 15 minut / Code is valid for 15 minutes."
    )
    send_email_message(to_email, subject, body)

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
    code = generate_verification_code()
    expires = datetime.utcnow() + timedelta(minutes=15)
    new_user = models.User(
        username=user.username, 
        email=user.email,
        password=hashed_password,
        is_verified=False,
        verification_code=code,
        verification_code_expires=expires
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Отправляем письмо с кодом
    send_verification_email(new_user.email, code)
    logger.info(f"[Register] Verification code for {new_user.email}: {code}")
    
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
    
    # Проверяем пользователя и пароль
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Nesprávný e-mail nebo heslo"
        )
    
    # Проверяем подтверждение email
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="email_not_verified"
        )
    
    token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "username": user.username
    }

# 5a. Верификация Email по коду
@app.post("/api/verify-email")
def verify_email(data: schemas.VerifyEmail, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Uživatel nenalezen")
    if user.is_verified:
        return {"detail": "already_verified"}
    if not user.verification_code or user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="wrong_code")
    if not user.verification_code_expires or datetime.utcnow() > user.verification_code_expires:
        raise HTTPException(status_code=400, detail="code_expired")
    
    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()
    logger.info(f"[Verify] {user.email} verified successfully")
    return {"detail": "verified"}

# 5b. Повторная отправка кода
@app.post("/api/resend-verification")
def resend_verification(data: schemas.ResendVerification, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Uživatel nenalezen")
    if user.is_verified:
        return {"detail": "already_verified"}
    # Rate-limit: не чаще чем раз в 60 секунд
    if user.verification_code_expires:
        time_left = user.verification_code_expires - datetime.utcnow()
        # Если код выдан менее 14 минут назад (из 15) — ещё не прошло 60 сек с последней отправки
        if time_left.total_seconds() > 14 * 60:
            raise HTTPException(status_code=429, detail="too_many_requests")
    
    code = generate_verification_code()
    expires = datetime.utcnow() + timedelta(minutes=15)
    user.verification_code = code
    user.verification_code_expires = expires
    db.commit()
    send_verification_email(user.email, code)
    logger.info(f"[Resend] New verification code for {user.email}: {code}")
    return {"detail": "code_sent"}

# 5c. Забыл пароль — отправить код на email
@app.post("/forgot-password")
def forgot_password(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    # Не раскрываем, существует ли пользователь — всегда отвечаем одинаково
    if not user:
        return {"detail": "code_sent"}
    
    # Rate-limit: раз в 60 секунд
    if user.reset_code_expires:
        time_left = user.reset_code_expires - datetime.utcnow()
        if time_left.total_seconds() > 14 * 60:
            raise HTTPException(status_code=429, detail="too_many_requests")
    
    code = generate_verification_code()
    expires = datetime.utcnow() + timedelta(minutes=15)
    user.reset_code = code
    user.reset_code_expires = expires
    db.commit()
    
    subject = "Subly – obnovení hesla / Password Reset"
    body = (
        f"Váš kód pro obnovení hesla v Subly je: {code}\n"
        f"Your Subly password reset code is: {code}\n\n"
        f"Kód je platný 15 minut / Code is valid for 15 minutes."
    )
    send_email_message(user.email, subject, body)
    logger.info(f"[ForgotPwd] Reset code for {user.email}: {code}")
    return {"detail": "code_sent"}

# 5d. Сброс пароля — проверить код и сохранить новый пароль
@app.post("/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Uživatel nenalezen")
    if not user.reset_code or user.reset_code != data.code:
        raise HTTPException(status_code=400, detail="wrong_code")
    if not user.reset_code_expires or datetime.utcnow() > user.reset_code_expires:
        raise HTTPException(status_code=400, detail="code_expired")
    
    user.password = get_password_hash(data.new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.commit()
    logger.info(f"[ResetPwd] Password changed for {user.email}")
    return {"detail": "password_reset"}

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

# ============ УВЕДОМЛЕНИЯ ============

# 15. Получить настройки уведомлений
@app.get("/api/me/notifications", response_model=schemas.NotificationSettingsResponse)
def get_notification_settings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.NotificationSettings).filter(models.NotificationSettings.user_id == current_user.id).first()
    if not notif:
        return {"notify_email": True, "notify_telegram": True, "notify_intervals": "3d,1d", "notify_language": "cs"}
    
    # Чтобы избежать поломок, если колонка еще не создана
    if not hasattr(notif, 'notify_language') or not notif.notify_language:
        notif.notify_language = "cs"

    return notif

# 16. Обновить настройки уведомлений
@app.put("/api/me/notifications", response_model=schemas.NotificationSettingsResponse)
def update_notification_settings(data: schemas.NotificationSettingsUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.NotificationSettings).filter(models.NotificationSettings.user_id == current_user.id).first()
    if not notif:
        notif = models.NotificationSettings(user_id=current_user.id)
        db.add(notif)
    
    notif.notify_email = data.notify_email
    notif.notify_telegram = data.notify_telegram
    notif.notify_intervals = data.notify_intervals
    notif.notify_language = data.notify_language
    db.commit()
    db.refresh(notif)
    return notif