from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    age: int
    gender: str

    phone_number: str
    address: str
    diagnosis: Optional[str]
    nationality: str
    tribe: str
    occupation: str
    marital_status: str
    next_of_kin: str
    created_at : Optional[datetime] = Field(default_factory=datetime.utcnow)
