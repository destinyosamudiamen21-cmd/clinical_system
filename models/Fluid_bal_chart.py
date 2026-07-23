from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid

class FluidBalance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    encounter_id: int = Field(foreign_key="encounter.id")
    time: datetime
    intake: Optional[float] = None
    output: Optional[float] = None
    balance: Optional[float] = None
    recorded_by: uuid.UUID = Field(foreign_key="user.uid")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class FluidCreate(SQLModel):
    encounter_id: int
    time: datetime
    intake: Optional[float] = None
    output: Optional[float] = None
    balance: Optional[float] = None

