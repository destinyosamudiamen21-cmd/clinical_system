from sqlmodel import Session, select 
from models.discharge_sum import DischargeSummary, DischargeCreate


class DischargeManager:
    def create(self, data: DischargeCreate, created_by, session: Session):
        d = DischargeSummary(
            **data.model_dump(), 
            created_by=created_by
            )
        session.add(d); session.commit(); session.refresh(d)
        return d
    
    def get_for_encounter(self, encounter_id, session: Session):
        return session.exec(select(DischargeSummary).where(DischargeSummary.encounter_id == encounter_id)).first()