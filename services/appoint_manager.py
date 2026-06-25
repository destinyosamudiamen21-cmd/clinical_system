from models.appointment import Appointment
from sqlmodel import Session, select


class AppointmentManager:
    
    def create_appointment(self, appointment_data: Appointment, session: Session ):
        session.add(appointment_data)
        session.commit()
        session.refresh(appointment_data)
        return appointment_data

    def search_appointment(self, appointment_id: int, session:Session ):
        # getting patient appointment
        p_appointment = session.get(Appointment, appointment_id)
        if not p_appointment:
            return None
        else:
            return p_appointment
        
    def update_appointment(self, appointment_id: int, updated_appointment_data: dict, session: Session):
        p_appointment = session.get(Appointment, appointment_id)
        if not p_appointment:
            return None
        else:
            for key, value in updated_appointment_data.items():
                setattr(Appointment, key, value)
            session.add(p_appointment)
            session.commit()
            session.refresh()
            return p_appointment

    def delete_appointment(self, appointment_id: str, session: Session):
        p_appointment = session.get(Appointment, appointment_id)
        if not p_appointment:
            return None
        else:
            session.delete(p_appointment)
            session.commit()
            return {"status": "sucessfull"}
    
    def list_appoinment(self, session: Session):
        return session.exec(select(Appointment)).all()
        
            
        