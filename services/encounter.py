from sqlmodel import Session, select
from models.encounter import EncounterCreate, Encounter
from models.patient import Patient


class EncounterManager():
    
    def create_encounter(self, encounter_data: EncounterCreate, attending_doctor, session: Session):
        encounter = Encounter(
            patient_id=encounter_data.patient_id,
            ward_clinic=encounter_data.ward_clinic,
            attending_doctor=attending_doctor
        )
        session.add(encounter)
        session.commit()
        session.refresh(encounter)
        return encounter

    def get_doctor_queue(self, session: Session):
        results = session.exec(
            select(Encounter, Patient)                      
            # select from BOTH tables
            .join(Patient, Encounter.patient_id == Patient.id)   
            # match them on this condition
            .where(Encounter.workflow_status == "awaiting_doctor")
        ).all()

        # results is a list of (Encounter, Patient) pairs
        return [
            {
                "id": enc.id,
                "patient_id": enc.patient_id,
                "patient_name": patient.full_name,
                "ward_clinic": enc.ward_clinic,
                "encounter_date": enc.encounter_date,
                "workflow_status": enc.workflow_status,
            }
            for enc, patient in results
        ]

    def get_encounter(self, encounter_id, session: Session):
        return session.get(Encounter, encounter_id)
    
    def get_patient_encounters(self, patient_id, session: Session):
        return session.exec(
            select(Encounter).where(
                Encounter.patient_id == patient_id,
                Encounter.status != "archived"
            )
        ).all()


    def get_encounter(self, encounter_id, session: Session):
        return session.get(Encounter, encounter_id)
    
    
    def get_encounter(self, encounter_id, session: Session):
        return session.get(Encounter, encounter_id)
    
    def archive_encounter(self, encounter_id, session: Session):
        encounter = session.get(Encounter, encounter_id)
        if not encounter:
            return None
        encounter.status = "archived"
        session.add(encounter)
        session.commit()
        session.refresh(encounter)
        return encounter

    def restore_encounter(self, encounter_id, session: Session):
        encounter = session.get(Encounter, encounter_id)
        if not encounter:
            return None
        encounter.status = "open"
        session.add(encounter)
        session.commit()
        session.refresh(encounter)
        return encounter

    def get_archived_encounters(self, patient_id, session: Session):
        return session.exec(
            select(Encounter).where(
                Encounter.patient_id == patient_id,
                Encounter.status == "archived"
            )
        ).all()
    
    def advance_workflow(self, encounter_id, new_status, session: Session, only_if=None):
        """Move an encounter to a new workflow stage.
        If only_if is given, only advance when current status matches it."""
        encounter = session.get(Encounter, encounter_id)
        if not encounter:
            return None
        if only_if is not None and encounter.workflow_status != only_if:
            return encounter   # not in the expected stage, leave it alone
        encounter.workflow_status = new_status
        session.add(encounter)
        session.commit()
        session.refresh(encounter)
        return encounter
