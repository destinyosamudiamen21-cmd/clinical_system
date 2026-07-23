from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import RoleChecker, get_current_user
from services.vital_manager import VitalsManager
from models.vital_signs import VitalsCreate

vital_router = APIRouter()

vitals_mgr = VitalsManager()

@vital_router.post("/")
def create_vitals(
    data: VitalsCreate, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["nurse", "doctor", "admin"]))
    ):
    return vitals_mgr.create(data, recorded_by=current_user["uid"], session=session)

@vital_router.get("/{encounter_id}")
def get_vitals(
    encounter_id: int, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)):
    return vitals_mgr.get_for_encounter(encounter_id, session)

