from fastapi import APIRouter,Depends
from models.appointment import AppointmentCreate
from sqlmodel import Session
from services.appoint_manager import AppointmentManager
from storage.database import get_session
from fastapi.exceptions import HTTPException

appointment_router = APIRouter()

manager = AppointmentManager()

@appointment_router.get("/{appointment_id}")
def get_appointments(appointment_id: int, session: Session = Depends(get_session)):
    appointment= manager.search_appointment(appointment_id, session)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@appointment_router.get("/")
def list_of_appointments(session: Session= Depends(get_session)):
    return manager.list_appoinment(session)

@appointment_router.post("/")
def create_appointment(appointment:AppointmentCreate, session: Session=Depends(get_session)):
    appointment = manager.create_appointment(appointment, session)
    if not appointment:
        raise HTTPException(status_code=404, detail="Patient not found. Register the patient first.")
    
@appointment_router.put("/{appointment_id}")
def update_appointment(appointment_id:int, appointment: AppointmentCreate, session: Session = Depends(get_session)):
    return manager.update_appointment(appointment_id,appointment.model_dump() ,session)

@appointment_router.delete("/{appointment_id}")
def delete_appointment(appointment_id: int, session: Session = Depends(get_session)):
    return manager.delete_appointment(appointment_id, session)
    