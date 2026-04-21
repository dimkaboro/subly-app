from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/api/subscriptions",
    tags=["Subscriptions"]
)

@router.get("/", response_model=list[schemas.SubscriptionResponse])
def get_subscriptions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return current_user.subscriptions

@router.post("/", response_model=schemas.SubscriptionResponse)
def create_subscription(sub: schemas.SubscriptionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_sub = models.Subscription(
        name=sub.name,
        price=sub.price,
        currency=sub.currency,
        cycle=sub.cycle,
        nextPayment=sub.nextPayment,
        user_id=current_user.id
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.delete("/{sub_id}")
def delete_subscription(sub_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sub_query = db.query(models.Subscription).filter(
        models.Subscription.id == sub_id, 
        models.Subscription.user_id == current_user.id
    )
    sub = sub_query.first()
    if not sub:
        raise HTTPException(status_code=404, detail="Předplatné nebylo nalezeno")
    
    sub_query.delete(synchronize_session=False)
    db.commit()
    return {"detail": "Smazáno úspěšně"}

@router.put("/{sub_id}", response_model=schemas.SubscriptionResponse)
def update_subscription(sub_id: int, sub_data: schemas.SubscriptionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sub = db.query(models.Subscription).filter(
        models.Subscription.id == sub_id,
        models.Subscription.user_id == current_user.id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Předplatné nebylo nalezeno")
    
    sub.name = sub_data.name
    sub.price = sub_data.price
    sub.currency = sub_data.currency
    sub.cycle = sub_data.cycle
    sub.nextPayment = sub_data.nextPayment
    
    db.commit()
    db.refresh(sub)
    return sub
