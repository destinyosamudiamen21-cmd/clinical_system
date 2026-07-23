from sqlmodel import Session, select
from models.vital_signs import VitalSigns, VitalsCreate

class VitalsManager:
    def create(self, data:VitalsCreate, recorded_by, session: Session):
        v = VitalSigns(
            **data.model_dump(), 
            recorded_by=recorded_by
            )
        session.add(v); session.commit(); session.refresh(v)
        return v
    
    def get_for_encounter(self, encounter_id, session: Session):
        # MANY per encounter -> .all()
        return session.exec(select(VitalSigns).where(VitalSigns.encounter_id == encounter_id)).all()

