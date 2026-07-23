from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid

class DischargeSummary(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    encounter_id: int = Field(foreign_key="encounter.id")
    diagnosis: str
    hospital_course: str
    discharge_medications: str
    follow_up: str
    created_by: uuid.UUID = Field(foreign_key="user.uid")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class DischargeCreate(SQLModel):
    encounter_id: int
    diagnosis: str
    hospital_course: str
    discharge_medications: str
    follow_up: str