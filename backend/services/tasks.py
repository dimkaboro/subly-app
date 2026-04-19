import httpx
import logging
from datetime import datetime
import calendar
import re

import models
from database import SessionLocal
from core.config import TELEGRAM_BOT_TOKEN
from services.email import send_email_message

logger = logging.getLogger(__name__)

async def send_telegram_message(chat_id: str, text: str) -> None:
    """Odeslání zprávy přes Telegram Bot API."""
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
    """Hodinový úkol: kontrola předplatných a odesílání upozornění."""
    db = SessionLocal()
    try:
        now = datetime.now()
        users = db.query(models.User).all()
        logger.info(f"[Scheduler] Checking payments for {len(users)} users (Hourly check)...")

        for user in users:
            # Načtení nastavení upozornění
            if user.notification_settings:
                user_notifs = user.notification_settings[0]
            else:
                user_notifs = models.NotificationSettings(notify_email=True, notify_telegram=True, notify_intervals="3d,1d")
            
            intervals = user_notifs.notify_intervals.split(",")

            # Jazyk upozornění z nastavení uživatele
            user_lang = user_notifs.notify_language if hasattr(user_notifs, 'notify_language') and user_notifs.notify_language else "cs"

            for sub in user.subscriptions:
                if not sub.nextPayment:
                    continue
                try:
                    # Parsování data platby
                    payment_date = datetime.strptime(sub.nextPayment, "%Y-%m-%d")
                except ValueError:
                    continue

                # --- Automatické posunutí data ---
                # Pokud datum platby již prošlo, posuneme ho dopředu
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
                            # Neznámý cyklus — přeskočíme
                            break 
                    
                    sub.nextPayment = payment_date.strftime("%Y-%m-%d")
                    db.commit()
                    logger.info(f"[Scheduler] Auto-rolled over '{sub.name}' for user {user.email} to {sub.nextPayment}")
                # -----------------------------------

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

                # Pokud se čas shoduje s intervaly uživatele — odeslat
                if matched_interval:
                    formatted_date = payment_date.strftime('%d.%m.%Y')
                    t_data = NOTIFICATIONS_I18N.get(user_lang, NOTIFICATIONS_I18N["cs"])
                    time_str = t_data["times"][matched_interval]
                    msg_body = t_data["reminder"].format(time_str=time_str, name=sub.name, price=sub.price, currency=sub.currency, date=formatted_date)
                    subject = f"Subly: {sub.name} - {time_str}"
                    
                    if user_notifs.notify_telegram and user.telegram_chat_id:
                        await send_telegram_message(user.telegram_chat_id, msg_body)
                    
                    if user_notifs.notify_email and user.email:
                        # Odstranění HTML tagů pro textový e-mail
                        plain_body = re.sub('<[^<]+?>', '', msg_body)
                        send_email_message(user.email, subject, plain_body)
    finally:
        db.close()
