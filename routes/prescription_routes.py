from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from storage.database import get_session
from auth.dependencies import get_current_user
from models.prescription import Prescription

prescription_router = APIRouter()


@prescription_router.get("/encounter/{encounter_id}")
def get_for_encounter(
    encounter_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    return session.exec(
        select(Prescription).where(Prescription.encounter_id == encounter_id)
    ).first()
