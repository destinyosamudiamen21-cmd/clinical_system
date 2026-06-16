from fastapi import APIRouter
from services.appoint_manager import AppointmentManager
from pydantic import BaseModel

appointment_router = APIRouter()

manager = AppointmentManager()

class AppointmentScheme(BaseModel):
   appointment_id: str
   patient_id: str
   appointment_data: str
   doctor_name: str
   reason: str
   status: str



@appointment_router.get("/{appointment_id}")
def get_appointments(appointment_id: str):
    appointment = manager.search_appointment(appointment_id)
    return appointment

@appointment_router.get("/")
def list_of_appointments():
    appointment = manager.list_appoinment()
    return appointment

@appointment_router.post("/")
def create_appointment(appointment: AppointmentScheme):
    appointment = manager.create_appointment(appointment.model_dump())
    return appointment
    
@appointment_router.put("/{appointment_id}")
def update_appointment(appointment_id: str, appointment: AppointmentScheme):
    appointment = manager.update_appointment(appointment_id, appointment.model_dump())
    return appointment
    
@appointment_router.delete("/{appointment_id}")
def delete_appointment(appointment_id: str):
    appointment = manager.delete_appointment(appointment_id)
    return appointment
    