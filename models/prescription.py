from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime
from datetime import datetime, UTC
from typing import Optional
import uuid


class Prescription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    encounter_id: int = Field(foreign_key="encounter.id", index=True)
    code: str = Field(index=True, unique=True)
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    is_dispensed: bool = Field(default=False)
    dispensed_by: Optional[uuid.UUID] = Field(default=None, foreign_key="user.uid")
    dispensed_at: Optional[datetime] = None
    created_by: uuid.UUID = Field(foreign_key="user.uid")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
