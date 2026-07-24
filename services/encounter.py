from sqlmodel import Session, select
from models.encounter import EncounterCreate, Encounter


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

    def get_patient_encounters(self, patient_id, session: Session):
        return session.exec(
            select(Encounter).where(
                Encounter.patient_id == patient_id,
                Encounter.status != "archived"        # ← ADDED
            )
        ).all()

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
