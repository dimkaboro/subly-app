from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

import models
import schemas
from dependencies import get_db
from core.security import get_password_hash, verify_password, create_access_token
from services.email import generate_verification_code, send_verification_email, send_email_message

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Auth"])

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Uživatel s tímto e-mailem již existuje")
    
    db_username = db.query(models.User).filter(models.User.username == user.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Tato přezdívka је již obsazená")

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

    send_verification_email(new_user.email, code)
    logger.info(f"[Register] Verification code for {new_user.email}: {code}")
    
    return new_user

@router.post("/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Nesprávný e-mail nebo heslo"
        )
    
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

@router.post("/api/verify-email")
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

@router.post("/api/resend-verification")
def resend_verification(data: schemas.ResendVerification, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Uživatel nenalezen")
    if user.is_verified:
        return {"detail": "already_verified"}
    if user.verification_code_expires:
        time_left = user.verification_code_expires - datetime.utcnow()
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

@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        return {"detail": "code_sent"}
    
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

@router.post("/reset-password")
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
