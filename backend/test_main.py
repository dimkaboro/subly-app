import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from main import app, get_db
import models

# Инициализация тестовой in-memory базы данных SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Подменяем зависимость подключения к БД
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

from unittest.mock import patch

# Фикстура для пересоздания таблиц перед каждым тестом
@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# Фикстура для блокировки реальной отправки писем при тестировании
@pytest.fixture(autouse=True)
def mock_emails():
    with patch("main.send_verification_email"), patch("main.send_email_message"):
        yield

# Настройка тестовых данных
test_user = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password1!",
    "repeat_password": "Password1!"
}

def test_register_user_success():
    """Тест 1: Успешная регистрация пользователя"""
    response = client.post("/register", json=test_user)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]
    assert data["username"] == test_user["username"]
    assert "id" in data

def test_register_duplicate_email():
    """Тест 2: Ошибка при регистрации с существующим email"""
    client.post("/register", json=test_user) # Первая регистрация
    response = client.post("/register", json=test_user) # Попытка дубля
    assert response.status_code == 400
    assert response.json()["detail"] == "Uživatel s tímto e-mailem již existuje"

def test_login_unverified_user():
    """Тест 3: Запрет входа без подтверждения почты (email_not_verified)"""
    client.post("/register", json=test_user)
    response = client.post("/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    assert response.status_code == 403
    assert response.json()["detail"] == "email_not_verified"

def test_verify_email():
    """Тест 4: Успешная верификация почты"""
    client.post("/register", json=test_user)
    
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.email == test_user["email"]).first()
    v_code = user.verification_code
    db.close()
    
    response_verify = client.post("/api/verify-email", json={
        "email": test_user["email"],
        "code": v_code
    })
    assert response_verify.status_code == 200
    assert response_verify.json()["detail"] == "verified"

def test_login_verified_user():
    """Тест 5: Успешный вход после верификации"""
    client.post("/register", json=test_user)
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.email == test_user["email"]).first()
    user.is_verified = True
    db.commit()
    db.close()

    response_login = client.post("/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    assert response_login.status_code == 200
    assert "access_token" in response_login.json()

def test_create_subscription():
    """Тест 6: Создание подписки авторизованным пользователем"""
    # Регистрация и верификация
    client.post("/register", json=test_user)
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.email == test_user["email"]).first()
    user.is_verified = True # симуляция верификации
    db.commit()
    db.close()

    # Логин для получения токена
    token_response = client.post("/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    token = token_response.json()["access_token"]
    
    # Запрос на создание подписки
    sub_data = {
        "name": "Netflix",
        "price": 300,
        "currency": "CZK",
        "cycle": "Měsíčně",
        "nextPayment": "2026-04-10"
    }
    response = client.post(
        "/api/subscriptions", 
        json=sub_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Netflix"
    assert "id" in data

def test_get_subscriptions():
    """Тест 7: Получение списка подписок"""
    # Регистрация и верификация
    client.post("/register", json=test_user)
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.email == test_user["email"]).first()
    user.is_verified = True
    db.commit()
    db.close()

    token_response = client.post("/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    token = token_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Изначально список пуст
    resp_empty = client.get("/api/subscriptions", headers=headers)
    assert resp_empty.status_code == 200
    assert len(resp_empty.json()) == 0
    
    # Создаем 2 подписки
    client.post("/api/subscriptions", json={"name": "Spotify", "price": 169, "currency": "CZK", "cycle": "Měsíčně", "nextPayment": "2026-04-10"}, headers=headers)
    client.post("/api/subscriptions", json={"name": "Apple TV", "price": 139, "currency": "CZK", "cycle": "Měsíčně", "nextPayment": "2026-04-10"}, headers=headers)
    
    # Проверяем, что теперь их 2
    resp_full = client.get("/api/subscriptions", headers=headers)
    assert resp_full.status_code == 200
    assert len(resp_full.json()) == 2
