from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid

class Payment(SQLModel, table=True):
    id:Optional[int] = Field(default=None, primary_key=True)
    pin: str
    patient_id: int = Field(foreign_key="patient.id")
    confirmed_by : uuid.UUID = Field(foreign_key="user.uid")
    is_used: bool = Field(default=False)
    created_by: Optional[datetime] =Field(default_factory=lambda: datetime.now(UTC))

class PaymentConfirm(SQLModel):
    """schema to confirm payment"""
    patient_id: int