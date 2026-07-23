from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid


class MedicationChart(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    encounter_id: int = Field(foreign_key="encounter.id")
    drug: str
    dose: str
    route: str
    frequency: str
    start_date: Optional[datetime] = None
    stop_date: Optional[datetime] = None
    prescribed_by: uuid.UUID = Field(foreign_key="user.uid")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class MedicationCreate(SQLModel):
    encounter_id: int
    drug: str
    dose: str
    route: str
    frequency: str
    start_date: Optional[datetime] = None
    stop_date: Optional[datetime] = None
