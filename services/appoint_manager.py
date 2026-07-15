from models.appointment import Appointment,AppointmentCreate
from sqlmodel import Session, select
from models.patient import Patient
from services.pin_generator import PaymentManager
from fastapi.exceptions import HTTPException
payment_manager = PaymentManager()

class AppointmentManager:
    
    def create_appointment(self, appointment_data: AppointmentCreate, session: Session ):
        patient = session.get(Patient, appointment_data.patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        #a valid and unused pin must exit for this patient
        payment = payment_manager.get_valid_pin(
            appointment_data.pin,
            appointment_data.patient_id,
            session
        )

        if not payment:
            raise HTTPException(status_code=404, detail="invalid or used pin")
        appointment = Appointment.model_validate(appointment_data)
        session.add(appointment)

        #mark new pin as used and prevent reuse
        payment.is_used = True
        session.add(payment)

        session.commit()
        session.refresh(appointment)
        return appointment 
    
    def get_appointment_by_patient(self, patient_id: str, session: Session):
        return session.exec(select(Appointment).where(Appointment.patient_id == patient_id)).all()
            
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
                setattr(p_appointment, key, value)
            session.add(p_appointment)
            session.commit()
            session.refresh(p_appointment)
            return p_appointment

    def delete_appointment(self, appointment_id: int, session: Session):
        p_appointment = session.get(Appointment, appointment_id)
        if not p_appointment:
            return None
        else:
            session.delete(p_appointment)
            session.commit()
            return {"status": "sucessfull"}
    
    
    def list_appoinment(self, session: Session):
        return session.exec(select(Appointment)).all()
        
            
        