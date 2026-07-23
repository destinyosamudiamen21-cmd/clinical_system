from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import RoleChecker, get_current_user
from services.procedure_manager import ProcedureManager
from models.procedure_note import ProcedureCreate

procedure_router = APIRouter()

procedure_mgr = ProcedureManager()



@procedure_router.post("/")
def create_procedure(
    data: ProcedureCreate, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["doctor", "admin"]))):
    return procedure_mgr.create(data, created_by=current_user["uid"], session=session)

@procedure_router.get("/{encounter_id}")
def get_procedure(
    encounter_id: int, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)):
    return procedure_mgr.get_for_encounter(encounter_id, session)


