import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Import Services & Bot
from telegram_bot import run_bot
from services.tasks import check_upcoming_payments

# Import Routers
from routers import auth, subscriptions, users, notifications

# Load environment varialbes from config module first
import core.config 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Telegram Bot start
    bot_task = asyncio.create_task(run_bot())

    # Odesílání upozornění každou hodinu
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

    # Ukončení
    scheduler.shutdown(wait=False)
    bot_task.cancel()
    try:
        await bot_task
    except asyncio.CancelledError:
        pass
    logger.info("🛑 Scheduler and bot stopped.")

app = FastAPI(lifespan=lifespan)

# CORS — povolení požadavků z frontendu
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# Připojení routerů (API endpoints)
app.include_router(auth.router)
app.include_router(subscriptions.router)
app.include_router(users.router)
app.include_router(notifications.router)