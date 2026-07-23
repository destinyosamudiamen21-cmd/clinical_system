from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid

class NursingAssessment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    encounter_id: int = Field(foreign_key="encounter.id")
    chief_complaint: str
    nursing_assessment: str
    nursing_diagnosis: str
    care_plan: str
    evaluation: str
    created_by: uuid.UUID = Field(foreign_key="user.uid")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class NursingCreate(SQLModel):
    encounter_id: int
    chief_complaint: str
    nursing_assessment: str
    nursing_diagnosis: str
    care_plan: str
    evaluation: str

