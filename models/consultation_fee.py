from datetime import datetime, UTC
from typing import Optional
from sqlmodel import Field, SQLModel

class ConsultationFee(SQLModel, table=True):
    id:Optional[int] = Field(default=None, primary_key=True)
    amount: float
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(UTC))

class ConsultationFeeUpdate(SQLModel):
    amount: float