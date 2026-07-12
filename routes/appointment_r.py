from fastapi import APIRouter,Depends
from models.appointment import AppointmentCreate
from sqlmodel import Session
from services.appoint_manager import AppointmentManager
from storage.database import get_session

appointment_router = APIRouter()

manager = AppointmentManager()

@appointment_router.get("/search")
def search_by_name(name: str, session: Session = Depends(get_session)):
    return manager.search_by_name(name, session)

@appointment_router.get("/{appointment_id}")
def get_appointments(appointment_id: int, session: Session = Depends(get_session)):
    return manager.search_appointment(appointment_id, session)

@appointment_router.get("/")
def list_of_appointments(session: Session= Depends(get_session)):
    return manager.list_appoinment(session)

@appointment_router.post("/")
def create_appointment(appointment:AppointmentCreate, session: Session=Depends(get_session)):
    return manager.create_appointment(appointment, session)
    
@appointment_router.put("/{appointment_id}")
def update_appointment(appointment_id:int, appointment: AppointmentCreate, session: Session = Depends(get_session)):
    return manager.update_appointment(appointment_id,appointment.model_dump() ,session)

@appointment_router.delete("/{appointment_id}")
def delete_appointment(appointment_id: int, session: Session = Depends(get_session)):
    return manager.delete_appointment(appointment_id, session)
    