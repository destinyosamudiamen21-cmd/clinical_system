from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid

class UserBase(SQLModel):
    """Shared fields"""
    email: str
    role: str 
    full_name: str

class UserCreate(UserBase):
    """What the fastapi recieves"""
    password: str
    pass

class User(UserBase, table=True):
    """what goes to postresql"""
    uid : uuid.UUID = Field(primary_key=True, default_factory=uuid.uuid4)
    is_active: bool = Field(default=True)
    hashed_password: str
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(UTC))