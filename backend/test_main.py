import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from main import app, get_db
import models

# Testovací in-memory databáze (SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Přepnutí na testovací DB
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

from unittest.mock import patch

# Fixture: převytvoření tabulek před každým testem
@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# Fixture: blokujeme skutečné odesílání e-mailů
@pytest.fixture(autouse=True)
def mock_emails():
    with patch("main.send_verification_email"), patch("main.send_email_message"):
        yield

# Testovací data
test_user = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password1!",
    "repeat_password": "Password1!"
}

def test_register_user_success():
    """Test 1: Úspěšná registrace uživatele"""
    response = client.post("/register", json=test_user)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]
    assert data["username"] == test_user["username"]
    assert "id" in data

def test_register_duplicate_email():
    """Test 2: Chyba při duplicitním e-mailu"""
    client.post("/register", json=test_user)  # První registrace
    response = client.post("/register", json=test_user)  # Pokus o duplikát
    assert response.status_code == 400
    assert response.json()["detail"] == "Uživatel s tímto e-mailem již existuje"

def test_login_unverified_user():
    """Test 3: Zákaz přihlášení bez ověřeného e-mailu"""
    client.post("/register", json=test_user)
    response = client.post("/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    assert response.status_code == 403
    assert response.json()["detail"] == "email_not_verified"

def test_verify_email():
    """Test 4: Úspěšné ověření e-mailu"""
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
    """Test 5: Úspěšné přihlášení po ověření"""
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
    """Test 6: Vytvoření předplatného autorizovaným uživatelem"""
    # Registrace a ověření
    client.post("/register", json=test_user)
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.email == test_user["email"]).first()
    user.is_verified = True  # simulace ověření
    db.commit()
    db.close()

    # Přihlášení pro získání tokenu
    token_response = client.post("/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    token = token_response.json()["access_token"]
    
    # Vytvoření předplatného
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
    """Test 7: Získání seznamu předplatných"""
    # Registrace a ověření
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
    
    # Prvně je seznam prázdný
    resp_empty = client.get("/api/subscriptions", headers=headers)
    assert resp_empty.status_code == 200
    assert len(resp_empty.json()) == 0
    
    # Vytvoříme 2 předplatné
    client.post("/api/subscriptions", json={"name": "Spotify", "price": 169, "currency": "CZK", "cycle": "Měsíčně", "nextPayment": "2026-04-10"}, headers=headers)
    client.post("/api/subscriptions", json={"name": "Apple TV", "price": 139, "currency": "CZK", "cycle": "Měsíčně", "nextPayment": "2026-04-10"}, headers=headers)
    
    # Teď jich musí být 2
    resp_full = client.get("/api/subscriptions", headers=headers)
    assert resp_full.status_code == 200
    assert len(resp_full.json()) == 2
