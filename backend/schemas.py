import re
from pydantic import BaseModel, EmailStr, model_validator, field_validator

# ---СХЕМЫ ДЛЯ ПОЛЬЗОВАТЕЛЯ--- 
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 1. Схема для регистрации, данные приходят из React
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    repeat_password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Heslo musí mít alespoň 8 znaků') # Минимум 8 символов
        if not re.search(r'[A-Z]', v):
            raise ValueError('Heslo musí obsahovat alespoň jedno velké písmeno') # Хотя бы одна заглавная буква
        if not re.search(r'\d', v):
            raise ValueError('Heslo musí obsahovat alespoň jednu číslici') # Хотя бы одна цифра
        return v

    @model_validator(mode='after')
    def verify_password_match(self) -> 'UserCreate':
        if self.password != self.repeat_password:
            raise ValueError('Hesla se neshodují!')
        return self


# 2. Возврат схемы в React
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True


