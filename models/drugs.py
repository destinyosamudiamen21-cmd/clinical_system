# models/drug.py
from sqlmodel import SQLModel, Field
from datetime import datetime, UTC
from typing import Optional
import uuid


class Drug(SQLModel, table=True):
    """The clinic's drug catalogue — one row per item the pharmacy stocks."""
    id: Optional[int] = Field(default=None, primary_key=True)

    # Name as the clinic writes it. Imported verbatim, then editable by the
    # super-admin — the person who actually knows the drugs is the one who
    # corrects them, not the import script.
    name: str = Field(index=True)

    # Name minus the bracketed part, and the generic the clinic bracketed.
    # Both indexed, so searching either the brand or the generic finds the
    # drug ("CLAMIDE" and "GLIBENCLOMIDE" reach the same row).
    search_name: str = Field(index=True)
    generic: Optional[str] = Field(default=None, index=True)

    category: str = Field(default="Tablet/Capsule", index=True)

    # Current stock. A CACHED TOTAL, not the source of truth — it only ever
    # changes alongside a StockTransaction row.
    quantity: int = Field(default=0)

    # Per-drug low-stock threshold. Per-drug, not one global number: a common
    # painkiller and a rare antibiotic run low at very different points.
    reorder_level: Optional[int] = Field(default=None)

    unit_cost: Optional[float] = Field(default=None)

    # Set by the import for entries whose spelling looked wrong. Gives the
    # super-admin a worklist instead of 387 rows to hunt through. Clears
    # itself the moment they save an edit to that drug.
    needs_review: bool = Field(default=False, index=True)

    is_active: bool = Field(default=True)   # soft delete, same as Patient
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class DrugCreate(SQLModel):
    name: str
    search_name: Optional[str] = None
    generic: Optional[str] = None
    category: str = "Tablet/Capsule"
    reorder_level: Optional[int] = None
    unit_cost: Optional[float] = None
    # quantity is deliberately absent. Stock can only enter through a
    # StockTransaction, never by typing a number into a create form.


class DrugUpdate(SQLModel):
    """Every field optional — the route only applies what was actually sent."""
    name: Optional[str] = None
    generic: Optional[str] = None
    category: Optional[str] = None
    reorder_level: Optional[int] = None
    unit_cost: Optional[float] = None
    # quantity is absent here too, for the same reason. Correcting a count is
    # an adjustment transaction with a reason and an approver, not an edit.


class StockTransaction(SQLModel, table=True):
    """
    Every movement of stock, ever. The drug's quantity is the sum of these.

    Nothing edits a quantity directly — corrections are themselves
    transactions, with a reason and an approver. That is what makes
    "where did those six go?" an answerable question.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    drug_id: int = Field(foreign_key="drug.id", index=True)

    # "stock_in"   -> new stock arrived      (positive, super-admin)
    # "dispense"   -> sold to a patient      (negative, automatic, pharmacy)
    # "adjustment" -> count correction       (either sign, needs reason + approver)
    transaction_type: str = Field(index=True)

    # Signed: +50 stocked in, -10 dispensed, -6 corrected. Signed rather than
    # a separate direction column so the running total is simply SUM(change).
    change: int

    quantity_before: int
    quantity_after: int

    # Required for adjustments — an unexplained correction is exactly the
    # thing this design exists to prevent.
    reason: Optional[str] = None

    performed_by: uuid.UUID = Field(foreign_key="user.uid")
    approved_by: Optional[uuid.UUID] = Field(default=None, foreign_key="user.uid")

    # Links a dispense back to the prescription it fulfilled.
    prescription_id: Optional[int] = Field(default=None, foreign_key="prescription.id")

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
