from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime




class Appointment(SQLModel, table=True):

    id: Optional[int] = Field(default=None, primary_key=True)

    patient_id: str

    appointment_data: str

    doctor_name: str

    reason: str

    status: str

    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)