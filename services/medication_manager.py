from sqlmodel import Session, select
from models.medication_chart import MedicationChart, MedicationCreate


class MedicationManager:
    def create(self, data: MedicationCreate, prescribed_by, session: Session):
        m = MedicationChart(
            **data.model_dump(), 
            prescribed_by=prescribed_by)
        session.add(m); session.commit(); session.refresh(m)
        return m
    
    def get_for_encounter(self, encounter_id, session: Session):
        return session.exec(select(MedicationChart).where(MedicationChart.encounter_id == encounter_id)).all()
