from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid


class MedicationChart(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    encounter_id: int = Field(foreign_key="encounter.id")

    # NEW — links the prescription to the pharmacy's actual stock row.
    # Optional because prescriptions written before this change have no link,
    # and because the doctor may still need to prescribe something not in
    # the catalogue (in which case the pharmacist can't auto-deduct it).

    drug_id: Optional[int] = Field(default=None, foreign_key="drug.id", index=True)


    drug: str
    dose: str
    route: str
    frequency: str
    start_date: Optional[datetime] = None
    stop_date: Optional[datetime] = None


    # NEW — dispensing state, filled by the pharmacy
    quantity_dispensed: int = Field(default=0)
    is_dispensed: bool = Field(default=False, index=True)

    prescribed_by: uuid.UUID = Field(foreign_key="user.uid")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class MedicationCreate(SQLModel):
    encounter_id: int
    drug_id:Optional[int] = None 
    drug: str
    dose: str
    route: str
    frequency: str
    start_date: Optional[datetime] = None
    stop_date: Optional[datetime] = None
