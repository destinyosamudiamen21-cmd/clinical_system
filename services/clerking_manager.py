from sqlmodel import  Session, select
from models.clerking_note import ClerkingNote, ClerkingCreate


class ClerkingManager:
    def create(self, data:ClerkingCreate, created_by, session: Session):
        note = ClerkingNote(**data.model_dump(), created_by=created_by)
        session.add(note); session.commit(); session.refresh(note)
        return note
    
    def get_for_encounter(self, encounter_id, session: Session):
        # ONE per encounter -> .first()
        return session.exec(select(ClerkingNote).where(ClerkingNote.encounter_id == encounter_id)).first()

