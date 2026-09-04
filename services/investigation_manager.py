from sqlmodel import Session, select
from models.investigation import Investigation, InvestigationCreate
from datetime import datetime, UTC


class InvestigationManager:
    def create(self, data: InvestigationCreate, requested_by, session: Session):
        inv = Investigation(**data.model_dump(), requested_by=requested_by)
        session.add(inv)
        session.commit()
        session.refresh(inv)
        return inv

    def get_for_encounter(self, encounter_id, session: Session):
        return session.exec(
            select(Investigation).where(Investigation.encounter_id == encounter_id)
        ).all()

    def add_result(self, investigation_id: int, results: str, session: Session):
        inv = session.get(Investigation, investigation_id)
        if not inv:
            return None
        inv.results = results
        inv.date_completed = datetime.now(UTC)
        session.add(inv)
        session.commit()
        session.refresh(inv)
        return inv
