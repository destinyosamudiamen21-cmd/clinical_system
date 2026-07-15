from fastapi import APIRouter, Depends
from sqlmodel import Session
from storage.database import get_session
from models.pin import PaymentConfirm
from services.pin_generator import PaymentManager
from auth.dependencies import RoleChecker
import uuid

payment_router = APIRouter()
manager = PaymentManager()


@payment_router.post("/confirm")
def confirm_payment(
    payment_data: PaymentConfirm,
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(['admin']))
):
    payment = manager.confirm_payment(
        patient_id=payment_data.patient_id,
        #The Audit trail
        confirmed_by=uuid.UUID(current_user["uid"]),
        session=session
    )
    return payment