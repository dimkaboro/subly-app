"""
Telegram Bot module for Subly.
Handles the /start command, offers language selection via Inline Keyboard,
and saves the preference to the TelegramSettings table in the database.
"""

import os
import logging
import asyncio
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

from database import SessionLocal
import models

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

logger = logging.getLogger(__name__)

# ─── Translations ──────────────────────────────────────────────────────────────

TRANSLATIONS = {
    "cs": {
        "welcome": "Vyberte prosím svůj jazyk / Please select your language / Пожалуйста, выберите язык / Будь ласка, оберіть мову:",
        "setup_msg": (
            "👋 Ahoj! Jsem bot Subly — tvůj pomocník pro správu předplatných.\n\n"
            "🔑 Tvůj <b>Chat ID</b>: <code>{chat_id}</code>\n\n"
            "📋 Zkopíruj tento ID a vlož ho ve svém osobním účtu:\n"
            "<b>Nastavení → Telegram Bot → pole \"ID\"</b>\n\n"
            "Po propojení ti budu připomínat platby:\n"
            "• <b>3 dny</b> před stržením\n"
            "• <b>1 den</b> před stržením\n\n"
            "✅ Hotovo — už nezmeškáš žádnou platbu!"
        )
    },
    "en": {
        "welcome": "Vyberte prosím svůj jazyk / Please select your language / Пожалуйста, выберите язык / Будь ласка, оберіть мову:",
        "setup_msg": (
            "👋 Hello! I'm the Subly bot — your subscription management assistant.\n\n"
            "🔑 Your <b>Chat ID</b>: <code>{chat_id}</code>\n\n"
            "📋 Copy this ID and paste it in your personal account:\n"
            "<b>Settings → Telegram Bot → \"ID\" field</b>\n\n"
            "Once linked, I will remind you of upcoming payments:\n"
            "• <b>3 days</b> before deduction\n"
            "• <b>1 day</b> before deduction\n\n"
            "✅ Done — you won't miss any payments anymore!"
        )
    },
    "ru": {
        "welcome": "Vyberte prosím svůj jazyk / Please select your language / Пожалуйста, выберите язык / Будь ласка, оберіть мову:",
        "setup_msg": (
            "👋 Привет! Я бот Subly — твой помощник по управлению подписками.\n\n"
            "🔑 Твой <b>Chat ID</b>: <code>{chat_id}</code>\n\n"
            "📋 Скопируй этот ID и вставь его в личном кабинете:\n"
            "<b>Настройки → Telegram Bot → поле \"ID\"</b>\n\n"
            "После привязки я буду напоминать тебе о платежах:\n"
            "• За <b>3 дня</b> до списания\n"
            "• За <b>1 день</b> до списания\n\n"
            "✅ Готово — не пропусти ни одного платежа!"
        )
    },
    "ukr": {
        "welcome": "Vyberte prosím svůj jazyk / Please select your language / Пожалуйста, выберите язык / Будь ласка, оберіть мову:",
        "setup_msg": (
            "👋 Привіт! Я бот Subly — твій помічник з управління підписками.\n\n"
            "🔑 Твій <b>Chat ID</b>: <code>{chat_id}</code>\n\n"
            "📋 Скопіюй цей ID та встав його в особистому кабінеті:\n"
            "<b>Налаштування → Telegram Bot → поле \"ID\"</b>\n\n"
            "Після прив'язки я нагадуватиму тобі про платежі:\n"
            "• За <b>3 дні</b> до списання\n"
            "• За <b>1 день</b> до списання\n\n"
            "✅ Готово — не пропусти жодного платежу!"
        )
    }
}

# ─── Bot Handlers ─────────────────────────────────────────────────────────────

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start — send language selection keyboard."""
    chat_id = update.effective_chat.id
    logger.info(f"User used /start (Chat ID: {chat_id})")

    keyboard = [
        [InlineKeyboardButton("🇨🇿 Čeština", callback_data='lang_cs')],
        [InlineKeyboardButton("🇬🇧 English", callback_data='lang_en')],
        [InlineKeyboardButton("🇷🇺 Русский", callback_data='lang_ru')],
        [InlineKeyboardButton("🇺🇦 Українська", callback_data='lang_ukr')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    # Use generic multi-language welcome text
    await update.message.reply_html(
        "🇨🇿 Vyberte prosím svůj jazyk:\n"
        "🇬🇧 Please select your language:\n"
        "🇷🇺 Пожалуйста, выберите язык:\n"
        "🇺🇦 Будь ласка, оберіть мову:", 
        reply_markup=reply_markup
    )


async def language_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the language selection callback."""
    query = update.callback_query
    await query.answer()
    
    chat_id = str(query.message.chat_id)
    lang_code = query.data.split('_')[1] # extracts cs, en, ru, or ukr

    # Save to database
    db = SessionLocal()
    try:
        settings = db.query(models.TelegramSettings).filter(models.TelegramSettings.chat_id == chat_id).first()
        if settings:
            settings.language = lang_code
        else:
            settings = models.TelegramSettings(chat_id=chat_id, language=lang_code)
            db.add(settings)
        db.commit()
    except Exception as e:
        logger.error(f"Error saving language to DB: {e}")
    finally:
        db.close()

    # Get translated message
    msg = TRANSLATIONS.get(lang_code, TRANSLATIONS["cs"])["setup_msg"].format(chat_id=chat_id)
    
    # Edit the message to show the instructions and remove the keyboard
    await query.edit_message_text(text=msg, parse_mode='HTML')


async def run_bot() -> None:
    """Start the Telegram bot in polling mode (runs forever)."""
    if not TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not found in .env — bot will not start.")
        return

    application = Application.builder().token(TOKEN).build()
    
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CallbackQueryHandler(language_callback, pattern='^lang_'))

    logger.info("🤖 Telegram bot started (polling)...")
    await application.initialize()
    await application.start()
    await application.updater.start_polling(drop_pending_updates=True)

    # Keep running until cancelled
    try:
        await asyncio.Event().wait()
    except asyncio.CancelledError:
        pass
    finally:
        await application.updater.stop()
        await application.stop()
        await application.shutdown()
        logger.info("🤖 Telegram bot stopped.")
