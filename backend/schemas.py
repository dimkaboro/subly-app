import re
from pydantic import BaseModel, EmailStr, model_validator, field_validator

# --- Uživatel ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Registrace — validace hesla + shoda hesel
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    repeat_password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Heslo musí mít alespoň 8 znaků')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Heslo musí obsahovat alespoň jedno velké písmeno')
        if not re.search(r'\d', v):
            raise ValueError('Heslo musí obsahovat alespoň jednu číslici')
        return v

    @model_validator(mode='after')
    def verify_password_match(self) -> 'UserCreate':
        if self.password != self.repeat_password:
            raise ValueError('Hesla se neshodují!')
        return self


# Odpověď po registraci
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

# --- Token ---
class TokenData(BaseModel):
    email: str | None = None

# --- Ověření e-mailu ---
class VerifyEmail(BaseModel):
    email: EmailStr
    code: str

class ResendVerification(BaseModel):
    email: EmailStr

# --- Reset hesla ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    code: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Heslo musí mít alespoň 8 znaků')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Heslo musí obsahovat alespoň jedno velké písmeno')
        if not re.search(r'\d', v):
            raise ValueError('Heslo musí obsahovat alespoň jednu číslici')
        return v

# --- Předplatné ---
class SubscriptionBase(BaseModel):
    name: str
    price: int
    currency: str = "CZK"
    cycle: str = "Měsíčně"
    nextPayment: str

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- Nastavení uživatele ---
class UserProfileResponse(BaseModel):
    username: str
    email: EmailStr
    telegram_chat_id: str | None = None

    class Config:
        from_attributes = True

class ChangeEmail(BaseModel):
    new_email: EmailStr
    password: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Heslo musí mít alespoň 8 znaků')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Heslo musí obsahovat alespoň jedno velké písmeno')
        if not re.search(r'\d', v):
            raise ValueError('Heslo musí obsahovat alespoň jednu číslici')
        return v

class TelegramLink(BaseModel):
    telegram_chat_id: str

class NotificationSettingsUpdate(BaseModel):
    notify_email: bool
    notify_telegram: bool
    notify_intervals: str  # seznam oddělený čárkami (14d,7d,3d...)
    notify_language: str

class NotificationSettingsResponse(BaseModel):
    notify_email: bool
    notify_telegram: bool
    notify_intervals: str
    notify_language: str

    class Config:
        from_attributes = True
