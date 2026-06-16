from fastapi import APIRouter
from services.patient_manager import PatientManager
from pydantic import BaseModel

patient_router = APIRouter()

manager = PatientManager()

class PatientSchema(BaseModel):
    patient_id: str
    full_name: str
    age: int
    gender: str
    phone_Number: str
    address: str
    diagnosis: str
    nationality: str
    tribe: str
    occupation: str
    marital_status: str
    next_of_kin: str


@patient_router.get("/{patient_id}")
def get_patient(patient_id: str):

    patient = manager.search_patient(patient_id)

    return patient

@patient_router.get("/")
def patient_list(limit: int = 10):

    patient = manager.patient_list()

    return patient

@patient_router.post("/")
def create_patient(patient:PatientSchema):
    patient = manager.add_patient(patient.model_dump())
    return patient


@patient_router.put("/{patient_id}")
def update_patient(patient_id: str, patient: PatientSchema):
    patient = manager.update_patient(patient_id, patient.model_dump())

    return patient

@patient_router.delete("/{patient_id}")
def delete_patient(patient_id: str):

    patient = manager.remove_patient(patient_id)

    return patient