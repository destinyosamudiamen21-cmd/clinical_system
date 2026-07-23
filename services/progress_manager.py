from sqlmodel import Session, select
from models.progress_notes import ProgressNote, ProgressCreate


class ProgressManager:
    def create(self, data: ProgressCreate, created_by, session: Session):
        p = ProgressNote(
            **data.model_dump(), 
            created_by=created_by)
        session.add(p); session.commit(); session.refresh(p)
        return p
    
    def get_for_encounter(self, encounter_id, session: Session):
        return session.exec(select(ProgressNote).where(ProgressNote.encounter_id == encounter_id)).all()
