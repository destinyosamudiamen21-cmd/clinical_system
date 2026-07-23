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

    def get_patient_encounters(self, patient_id: str, session: Session):
        return session.exec(select(Encounter).where(Encounter.patient_id == patient_id)).all()

    def get_encounter(self, encounter_id, session: Session):
        return session.get(Encounter, encounter_id)