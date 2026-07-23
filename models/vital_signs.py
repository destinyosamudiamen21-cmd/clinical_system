from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid

class VitalSigns(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    encounter_id: int = Field(foreign_key="encounter.id")
    temperature: Optional[float] = None
    pulse: Optional[int] = None
    respiratory_rate: Optional[int] = None
    blood_pressure: Optional[str] = None   # "120/80" — a string, not a number
    spo2: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    bmi: Optional[float] = None
    pain_score: Optional[int] = None
    recorded_by: uuid.UUID = Field(foreign_key="user.uid")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class VitalsCreate(SQLModel):
    encounter_id: int
    temperature: Optional[float] = None
    pulse: Optional[int] = None
    respiratory_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    spo2: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    bmi: Optional[float] = None
    pain_score: Optional[int] = None
