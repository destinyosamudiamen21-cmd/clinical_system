from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from pydantic import BaseModel
from storage.database import get_session
from auth.dependencies import RoleChecker, get_current_user
from services.investigation_manager import InvestigationManager
from models.investigation import InvestigationCreate

investigation_router = APIRouter()
manager = InvestigationManager()


class ResultUpdate(BaseModel):
    results: str


@investigation_router.post("/")
def create_investigation(
    data: InvestigationCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["doctor", "admin"]))
):
    return manager.create(data, requested_by=current_user["uid"], session=session)


@investigation_router.get("/{encounter_id}")
def get_investigations(
    encounter_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    return manager.get_for_encounter(encounter_id, session)


@investigation_router.patch("/{investigation_id}/result")
def add_result(
    investigation_id: int,
    data: ResultUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["doctor", "nurse", "admin"]))
):
    inv = manager.add_result(investigation_id, data.results, session)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return inv
