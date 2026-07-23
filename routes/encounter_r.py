from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from storage.database import get_session
from services.encounter import EncounterManager
from models.encounter import EncounterCreate
from auth.dependencies import get_current_user, RoleChecker

encounter_router = APIRouter()
manager = EncounterManager()

@encounter_router.post("/")
def get_encounter(
    encounter_data: EncounterCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["doctor", "admin", "nurse"]))
    ):

    encounter = manager.create_encounter(
        encounter_data,
        attending_doctor=current_user["uid"],
        session=session
    )
    return encounter

@encounter_router.get("/patient/{patient_id}")
def get_patient_encounter(
    patient_id:int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    return manager.get_patient_encounters(patient_id, session)

@encounter_router.get("/{encounter_id}")
def get_encounter(
    encounter_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    encounter = manager.get_encounter(encounter_id, session)
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not Found")
    return encounter