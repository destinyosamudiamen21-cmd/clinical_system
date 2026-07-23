from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid

class ProgressNote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    encounter_id: int = Field(foreign_key="encounter.id")
    subjective: str
    objective: str
    assessment: str
    plan: str
    created_by: uuid.UUID = Field(foreign_key="user.uid")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ProgressCreate(SQLModel):
    encounter_id: int
    subjective: str
    objective: str
    assessment: str
    plan: str
