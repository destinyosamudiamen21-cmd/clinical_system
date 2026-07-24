from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime
from datetime import datetime, timedelta, UTC
from typing import Optional
import uuid

class PasswordResetToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(index=True)
    user_id: uuid.UUID = Field(foreign_key="user.uid")
    expires_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    is_used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
