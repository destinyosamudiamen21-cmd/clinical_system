from fastapi import APIRouter, Depends
from sqlmodel import Session
from models.patient import PatientCreate
from storage.database import get_session
from services.patient_manager import PatientManager
from auth.dependencies import RoleChecker, get_current_user
from fastapi.exceptions import HTTPException

patient_router = APIRouter()

manager = PatientManager()

@patient_router.get("/name")
def search_by_name(
    name: str, 
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
    ):
    return manager.search_by_name(name, session)

# MUST come BEFORE the /{patient_id} route
@patient_router.get("/archived")
def list_archived(
    session: Session = Depends(get_session),
    current_user = Depends(RoleChecker(["admin"]))
):
    return manager.list_archived_patients(session)

@patient_router.get("/{patient_id}")
def get_patient(
    patient_id:int, 
    session:Session=Depends(get_session),
    current_user = Depends(get_current_user)
    ):     
    return manager.search_patient( patient_id, session)

@patient_router.get("/")
def patient_list(
    session: Session=Depends(get_session),
    current_user = Depends(get_current_user)
    ):
    return manager.patient_list(session)

@patient_router.post("/")
def create_patient(
    patient:PatientCreate, 
    session: Session=Depends(get_session),
    current_user = Depends(get_current_user)
    ):
    existing = manager.find_duplicate(patient.full_name, patient.phone_number, session)
    if existing:
        raise HTTPException(status_code=409, detail="A patient named {existing.full_name} with this phone number already exists")
    return manager.add_patient(patient, session)

@patient_router.put("/{patient_id}")
def update_patient(
    patient_id: int, patient: PatientCreate, 
    session: Session=Depends(get_session),
    current_user = Depends(get_current_user)
    ):
    return manager.update_patient(patient_id, patient.model_dump(),session)

@patient_router.delete("/{patient_id}")
def delete_patient(
    patient_id:int, 
    session: Session=Depends(get_session),
    current_user = Depends(RoleChecker(["admin"]))):
    patient = manager.remove_patient(patient_id, session)
    if not patient:
       raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient archived"}

@patient_router.post("/{patient_id}/restore")
def restore_patient(
    patient_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(RoleChecker(["admin"]))
):
    patient = manager.restore_patient(patient_id, session)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient restored"}
