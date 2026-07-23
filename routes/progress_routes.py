from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import RoleChecker, get_current_user
from services.progress_manager import ProgressManager
from models.progress_notes import ProgressCreate

progress_router = APIRouter()

progress_mgr = ProgressManager()


@progress_router.post("/")
def create_progress(
    data: ProgressCreate, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["doctor", "nurse", "admin"]))
    ):
    return progress_mgr.create(data, created_by=current_user["uid"], session=session)

@progress_router.get("/{encounter_id}")
def get_progress(encounter_id: int, session: Session = Depends(get_session),
                current_user: dict = Depends(get_current_user)):
    return progress_mgr.get_for_encounter(encounter_id, session)
