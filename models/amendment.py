from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid


class Amendment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    document_type: str = Field(index=True)   # "clerking" | "progress" | "investigation"
    document_id: int = Field(index=True)     # id of the note being amended
    content: str
    created_by: uuid.UUID = Field(foreign_key="user.uid")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AmendmentCreate(SQLModel):
    document_type: str
    document_id: int
    content: str
