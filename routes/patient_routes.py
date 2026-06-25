from fastapi import APIRouter, Depends
from sqlmodel import Session
from models.patient import Patient
from storage.database import get_session
from services.patient_manager import PatientManager

patient_router = APIRouter()

manager = PatientManager()

@patient_router.get("/{id}")
def get_patient(patient_id:int, session:Session=Depends(get_session)):     
    return manager.search_patient( patient_id, session)

@patient_router.get("/")
def patient_list(session: Session=Depends(get_session)):
    return manager.patient_list(session)

@patient_router.post("/")
def create_patient(patient:Patient, session: Session=Depends(get_session)):
    return manager.add_patient(patient, session)

@patient_router.put("/{patient_id}")
def update_patient(patient_id: int, patient: Patient, session: Session=Depends(get_session)):
    return manager.update_patient(patient, patient_id, session)

@patient_router.delete("/{patient_id}")
def delete_patient(patient_id:int, session: Session=Depends(get_session)):
    return manager.remove_patient(patient_id, session)