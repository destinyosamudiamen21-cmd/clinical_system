from models.patient import Patient, PatientCreate
from sqlmodel import Session, select

class PatientManager:

    def search_by_name(self, name: str, session: Session):
        patients = session.exec(
            select(Patient).where(
                Patient.full_name.ilike(f"%{name}%"),
                Patient.is_active == True          # ← ADDED: don't surface archived patients
            )
        ).all()
        return patients

    def add_patient(self, patient_data: PatientCreate, session: Session):
        patient = Patient.model_validate(patient_data)
        session.add(patient)
        session.commit()
        session.refresh(patient)
        return patient

    def update_patient(self, patient_id: int, updated_data: dict, session: Session):
        patient = session.get(Patient, patient_id)
        if not patient:
            return None
        for key, value in updated_data.items():
            setattr(patient, key, value)
        session.add(patient)
        session.commit()
        session.refresh(patient)
        return patient

    def remove_patient(self, patient_id: int, session: Session):
        """Soft delete — archives the patient instead of destroying the record."""
        patient = session.get(Patient, patient_id)
        if not patient:
            return None
        patient.is_active = False
        session.add(patient)
        session.commit()
        return patient                              # ← CHANGED: return the patient, not a dict

    def restore_patient(self, patient_id: int, session: Session):   # ← NEW
        patient = session.get(Patient, patient_id)
        if not patient:
            return None
        patient.is_active = True
        session.add(patient)
        session.commit()
        session.refresh(patient)
        return patient

    def list_archived_patients(self, session: Session):             # ← NEW
        return session.exec(
            select(Patient).where(Patient.is_active == False)
        ).all()

    def search_patient(self, patient_id: int, session: Session):
        # Deliberately NOT filtered by is_active — admins need to view an
        # archived patient's details before restoring them.
        return session.get(Patient, patient_id)

    def patient_list(self, session: Session):
        return session.exec(
            select(Patient).where(Patient.is_active == True)
        ).all()

    def find_duplicate(self, full_name: str, phone_number: str, session: Session):
        # Deliberately NOT filtered by is_active — if someone re-registers an
        # archived patient, we want to catch it rather than create a duplicate.
        statement = select(Patient).where(
            Patient.full_name == full_name,
            Patient.phone_number == phone_number
        )
        return session.exec(statement).first()


    

           