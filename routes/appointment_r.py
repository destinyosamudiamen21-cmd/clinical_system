from fastapi import APIRouter,Depends
from models.appointment import Appointment
from sqlmodel import Session
from services.appoint_manager import AppointmentManager
from storage.database import get_session

appointment_router = APIRouter()

manager = AppointmentManager()

@appointment_router.get("/{id}")
def get_appointments(appointment_id: int, session: Session = Depends(get_session)):
    return manager.search_appointment(appointment_id, session)

@appointment_router.get("/")
def list_of_appointments(session: Session= Depends(get_session)):
    return manager.list_appoinment(session)

@appointment_router.post("/")
def create_appointment(appointment:Appointment, session: Session=Depends(get_session)):
    return manager.create_appointment(appointment, session)
    
@appointment_router.put("/{id}")
def update_appointment(appointment_id:int, appointment: Appointment, session: Session = Depends(get_session)):
    return(appointment,appointment_id, session)
    
@appointment_router.delete("/{id}")
def delete_appointment(appointment_id: int, session: Session = Depends(get_session)):
    return(appointment_id, session)
    