from sqlmodel import Session, select
from models.procedure_note import ProcedureNote, ProcedureCreate


class ProcedureManager:
    def create(self, data: ProcedureCreate, created_by, session: Session):
        p = ProcedureNote(
            **data.model_dump(), 
            created_by=created_by)
        session.add(p); session.commit(); session.refresh(p)
        return p
    
    def get_for_encounter(self, encounter_id, session: Session):
        return session.exec(select(ProcedureNote).where(ProcedureNote.encounter_id == encounter_id)).all()

