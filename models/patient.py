from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class PatientBase(SQLModel):
    """shared fields"""
    full_name: str
    age: int
    gender: str
    phone_number: str
    address: str
    diagnosis: Optional[str] = None
    nationality: str
    tribe: str
    occupation: str
    marital_status: str
    next_of_kin: str


class PatientCreate(PatientBase):
    """What the Api receives"""
    pass

class Patient(PatientBase, table=True):
    """What get saved to PostgreSQL"""
    __tablename__ = "patient"
    id: Optional[int] = Field(
        default=None,
          primary_key=True
          )
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

