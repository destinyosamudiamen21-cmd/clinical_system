from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import RoleChecker, get_current_user
from services.medication_manager import MedicationManager
from models.medication_chart import MedicationCreate


medication_router = APIRouter()

medication_mgr = MedicationManager()

@medication_router.post("/")
def create_medication(
    data: MedicationCreate, session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["doctor", "admin"]))):
    return medication_mgr.create(data, prescribed_by=current_user["uid"], session=session)

@medication_router.get("/{encounter_id}")
def get_medication(
encounter_id: int, session: Session = Depends(get_session),
current_user: dict = Depends(get_current_user)):
    return medication_mgr.get_for_encounter(encounter_id, session)

