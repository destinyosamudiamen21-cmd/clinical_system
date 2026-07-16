from fastapi import APIRouter,Depends
from models.appointment import AppointmentCreate
from sqlmodel import Session
from services.appoint_manager import AppointmentManager
from storage.database import get_session
from fastapi.exceptions import HTTPException
from auth.dependencies import RoleChecker, get_current_user

appointment_router = APIRouter()

manager = AppointmentManager()

@appointment_router.get("/{appointment_id}")
def get_appointments(
    appointment_id: int, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
    ):
    appointment= manager.search_appointment(appointment_id, session)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@appointment_router.get("/")
def list_of_appointments(
    session: Session= Depends(get_session),
    current_user:dict = Depends(get_current_user)
    ):
    return manager.list_appoinment(session)

@appointment_router.post("/")
def create_appointment(
    appointment:AppointmentCreate, 
    session: Session=Depends(get_session),
    current_user:dict = Depends(get_current_user)
    ):
    appointment = manager.create_appointment(appointment, session)
    if not appointment:
        raise HTTPException(status_code=404, detail="Patient not registered, Appointmemt can not be booked")
    
    
@appointment_router.put("/{appointment_id}")
def update_appointment(
    appointment_id:int, 
    appointment: AppointmentCreate, 
    session: Session = Depends(get_session),
    current_user:dict = Depends(RoleChecker(["admin"]))
    ):
    return manager.update_appointment(appointment_id,appointment.model_dump() ,session)

@appointment_router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int, 
    session: Session = Depends(get_session),
    current_user:dict = Depends(RoleChecker(["admin"]))
    ):
    return manager.delete_appointment(appointment_id, session)
    