from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import RoleChecker, get_current_user
from services.discharge_manager import DischargeManager
from models.discharge_sum import DischargeCreate

discharge_router = APIRouter()

discharge_mgr = DischargeManager()

@discharge_router.post("/")
def create_discharge(
    data: DischargeCreate, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["doctor", "admin"]))):
    return discharge_mgr.create(data, created_by=current_user["uid"], session=session)

@discharge_router.get("/{encounter_id}")
def get_discharge(encounter_id: int, session: Session = Depends(get_session),
                 current_user: dict = Depends(get_current_user)):
    return discharge_mgr.get_for_encounter(encounter_id, session)