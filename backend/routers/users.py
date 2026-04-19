from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from dependencies import get_db, get_current_user
from core.security import verify_password, get_password_hash, create_access_token

router = APIRouter(
    prefix="/api/me",
    tags=["Users"]
)

@router.get("/", response_model=schemas.UserProfileResponse)
def get_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/email")
def change_email(data: schemas.ChangeEmail, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not verify_password(data.password, current_user.password):
        raise HTTPException(status_code=400, detail="Nesprávné heslo")
    
    existing = db.query(models.User).filter(models.User.email == data.new_email).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="Tento e-mail je již používán")
    
    current_user.email = data.new_email
    db.commit()
    db.refresh(current_user)
    
    new_token = create_access_token(data={"sub": current_user.email})
    
    return {"detail": "E-mail úspěšně změněn", "access_token": new_token, "email": current_user.email}

@router.put("/password")
def change_password(data: schemas.ChangePassword, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Nesprávné aktuální heslo")
    
    current_user.password = get_password_hash(data.new_password)
    db.commit()
    
    return {"detail": "Heslo úspěšně změněno"}

@router.post("/telegram")
def link_telegram(data: schemas.TelegramLink, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.telegram_chat_id = data.telegram_chat_id
    db.commit()
    db.refresh(current_user)
    
    return {"detail": "Telegram úspěšně propojen", "telegram_chat_id": current_user.telegram_chat_id}

@router.delete("/telegram")
def unlink_telegram(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    current_user.telegram_chat_id = None
    db.commit()
    
    return {"detail": "Telegram odpojen"}
