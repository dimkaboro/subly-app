from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/api/me/notifications",
    tags=["Notifications"]
)

@router.get("/", response_model=schemas.NotificationSettingsResponse)
def get_notification_settings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.NotificationSettings).filter(models.NotificationSettings.user_id == current_user.id).first()
    if not notif:
        return {"notify_email": True, "notify_telegram": True, "notify_intervals": "3d,1d", "notify_language": "cs"}
    
    if not hasattr(notif, 'notify_language') or not notif.notify_language:
        notif.notify_language = "cs"

    return notif

@router.put("/", response_model=schemas.NotificationSettingsResponse)
def update_notification_settings(data: schemas.NotificationSettingsUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.NotificationSettings).filter(models.NotificationSettings.user_id == current_user.id).first()
    if not notif:
        notif = models.NotificationSettings(user_id=current_user.id)
        db.add(notif)
    
    notif.notify_email = data.notify_email
    notif.notify_telegram = data.notify_telegram
    notif.notify_intervals = data.notify_intervals
    notif.notify_language = data.notify_language
    db.commit()
    db.refresh(notif)
    return notif
