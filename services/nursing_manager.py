from sqlmodel import Session, select
from models.nursing_assessment import NursingAssessment, NursingCreate


class NursingManager:
    def create(self, data: NursingCreate, created_by, session: Session):
        n = NursingAssessment(
            **data.model_dump(), 
            created_by=created_by)
        
        session.add(n); session.commit(); session.refresh(n)
        return n
    
    def get_for_encounter(self, encounter_id, session: Session):
        return session.exec(select(NursingAssessment).where(NursingAssessment.encounter_id == encounter_id)).first()
