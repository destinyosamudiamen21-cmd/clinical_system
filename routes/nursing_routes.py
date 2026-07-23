from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import RoleChecker, get_current_user
from services.nursing_manager import NursingManager
from models.nursing_assessment import NursingCreate

nursing_router = APIRouter()

nursing_mgr = NursingManager()

@nursing_router.post("/")
def create_nursing(
    data: NursingCreate, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["nurse", "doctor", "admin"]))):

    return nursing_mgr.create(data, created_by=current_user["uid"], session=session)

@nursing_router.get("/{encounter_id}")
def get_nursing(encounter_id: int, session: Session = Depends(get_session),
               current_user: dict = Depends(get_current_user)):
    return nursing_mgr.get_for_encounter(encounter_id, session)
