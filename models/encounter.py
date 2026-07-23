from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid

class Encounter(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    appointment_id: Optional[int] = Field(foreign_key="appointment.id")
    patient_id: int = Field(foreign_key="patient.id")
    attending_doctor: uuid.UUID = Field(foreign_key="user.uid")
    encounter_date: datetime = Field(default_factory=lambda: datetime.now(UTC) )
    ward_clinic: Optional[str] =  None
    status: str = Field(default="open")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

class EncounterCreate(SQLModel):
    patient_id: int = Field(foreign_key="patient.id")
    ward_clinic: Optional[str] =  None