from models.patient import Patient, PatientCreate
from sqlmodel import Session, select



class PatientManager:

    def search_by_name(self, name: str, session:Session):
        patients = session.exec(
            select(Patient).where(Patient.full_name.ilike(f"%{name}%"))
        ).all()
        return patients

    def add_patient(self, patient_data: PatientCreate, session: Session):
        patient = Patient.model_validate(patient_data)
        session.add(patient)
        session.commit()
        session.refresh(patient)
        return patient
        
    def update_patient(self, patient_id: int, 
                       updated_data: dict, session: Session):
        patient = session.get(Patient, patient_id)
        if not patient:
            return None
        else:
            for key, value in updated_data.items():
                setattr(patient, key, value)
            session.add(patient)
            session.commit()
            session.refresh(patient)
            return patient
        
    def remove_patient(self, patient_id:int, session: Session):
        patient= session.get(Patient, patient_id)
        if not patient:
            return None
        else:
            session.delete(patient)
            session.commit()

            return {"status": "Patient deleted successfully"}
    
    def search_patient(self, patient_id:int, session: Session):
        patient = session.get(Patient, patient_id)
        if not patient:
            return None
        else:
            return patient
                
    def patient_list(self, session: Session):
        return session.exec(
            select(Patient) ).all()


       


    

           