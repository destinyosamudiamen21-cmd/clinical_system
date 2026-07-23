from sqlmodel import Session, select
from models.Fluid_bal_chart import FluidBalance, FluidCreate


class FluidManager:
    def create(self, data:FluidCreate, recorded_by, session: Session):
        f = FluidBalance(
            **data.model_dump(), 
            recorded_by=recorded_by
            )
        session.add(f); session.commit(); session.refresh(f)
        return f
    
    def get_for_encounter(self, encounter_id, session: Session):
        return session.exec(select(FluidBalance).where(FluidBalance.encounter_id == encounter_id)).all()
