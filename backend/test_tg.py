import os
import requests
from dotenv import load_dotenv

print("🚀 Скрипт запустился...")

# Загружаем наш токен из .env
load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if TOKEN:
    print("🔑 Токен успешно загружен из .env!")
else:
    print("❌ ВНИМАНИЕ: Токен не найден! Проверь файл .env")

# Твой ID
CHAT_ID = 541942445  

def send_telegram_message():
    print("⏳ Отправляем сообщение в Telegram...")
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": "Привет! Я твой новый бот для управления подписками. Связь установлена! 🚀"
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        print("✅ Сообщение успешно доставлено в твой Телеграм!")
    else:
        print("❌ Ошибка от Telegram:", response.text)

# Запускаем функцию
send_telegram_message()