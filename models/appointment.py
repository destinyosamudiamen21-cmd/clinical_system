from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class AppointmentBase(SQLModel):
    """Shared fields"""
    patient_id: int = Field(foreign_key="patient.id")
    appointment_date: datetime 
    doctor_name: str
    reason: str
    status: str

class AppointmentCreate(AppointmentBase):
    """What Api receives"""
    pin: str

class Appointment(AppointmentBase, table=True):
    """What gets saved to PostgreSQL"""
    __tablename__ = "appointment"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
