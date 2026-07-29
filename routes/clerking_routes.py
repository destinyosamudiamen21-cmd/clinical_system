from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import RoleChecker, get_current_user
from services.clerking_manager import ClerkingManager
from models.clerking_note import ClerkingCreate
from services.encounter import EncounterManager


clerking_router = APIRouter()

clerking_mgr = ClerkingManager()
encounter_man = EncounterManager()

@clerking_router.post("/")
def create_clerking(
    data: ClerkingCreate, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["doctor", "admin"]))
    ):
    clerking = clerking_mgr.create(data, created_by=current_user["uid"], session=session)
    encounter_man.advance_workflow(data.encounter_id, "in_progress", session, only_if="awaiting_doctor")
    return clerking

@clerking_router.get("/{encounter_id}")
def get_clerking(
    encounter_id: int,   
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)):
    return clerking_mgr.get_for_encounter(encounter_id, session)
