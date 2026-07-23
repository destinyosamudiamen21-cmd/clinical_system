from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid


class ClerkingNote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    encounter_id: int = Field(foreign_key="encounter.id")
    presenting_complaints: str
    history: str
    examination: str
    assessment: str
    diagnosis: str
    investigations: str
    treatment_plan: str
    follow_up: str
    created_by: uuid.UUID = Field(foreign_key="user.uid")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ClerkingCreate(SQLModel):
    encounter_id: int
    presenting_complaints: str
    history: str
    examination: str
    assessment: str
    diagnosis: str
    investigations: str
    treatment_plan: str
    follow_up: str
