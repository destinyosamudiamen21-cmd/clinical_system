# routes/drug_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from pydantic import BaseModel
from typing import Optional

from storage.database import get_session
from auth.dependencies import get_current_user, RoleChecker
from services.drugs_manager import DrugManager
from models.drugs import DrugCreate, DrugUpdate

drug_router = APIRouter()
manager = DrugManager()

# Catalogue edits are super-admin only. Everyone logged in can READ the
# catalogue — a doctor prescribing and a pharmacist dispensing both need to
# see what exists and what's in stock.
SUPER_ADMIN = RoleChecker(["super_admin"])


class StockInRequest(BaseModel):
    amount: int
    reason: Optional[str] = None


class AdjustRequest(BaseModel):
    new_count: int
    reason: str            # required — an unexplained correction defeats the design


# ---------- reading (any logged-in staff) ----------

# Literal paths MUST be declared before /{drug_id}, or FastAPI parses
# "search" and "low-stock" as drug ids and returns 422.

@drug_router.get("/search")
def search_drugs(
    name: str,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    return manager.search_drugs(name, session)


@drug_router.get("/low-stock")
def low_stock(
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    return manager.list_drugs(session, low_stock_only=True)


@drug_router.get("/needs-review")
def needs_review(
    session: Session = Depends(get_session),
    current_user: dict = Depends(SUPER_ADMIN),
):
    """The import's suspected-typo worklist."""
    return manager.list_drugs(session, needs_review_only=True)


@drug_router.get("/")
def list_drugs(
    category: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    return manager.list_drugs(session, category=category)


@drug_router.get("/{drug_id}/transactions")
def drug_transactions(
    drug_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(SUPER_ADMIN),
):
    return manager.get_transactions(drug_id, session)


@drug_router.get("/{drug_id}")
def get_drug(
    drug_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    drug = manager.get_drug(drug_id, session)
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    return drug


# ---------- writing (super-admin only) ----------

@drug_router.post("/")
def create_drug(
    data: DrugCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(SUPER_ADMIN),
):
    return manager.create_drug(data, session)


@drug_router.patch("/{drug_id}")
def update_drug(
    drug_id: int,
    data: DrugUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(SUPER_ADMIN),
):
    # PATCH, not PUT: this is a partial update. The form may send only the
    # name, and the other fields must survive untouched.
    drug = manager.update_drug(drug_id, data, session)
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    return drug


@drug_router.patch("/{drug_id}/archive")
def archive_drug(
    drug_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(SUPER_ADMIN),
):
    drug = manager.archive_drug(drug_id, session)
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    return {"message": "Drug archived"}


@drug_router.patch("/{drug_id}/restore")
def restore_drug(
    drug_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(SUPER_ADMIN),
):
    drug = manager.restore_drug(drug_id, session)
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found")
    return {"message": "Drug restored"}


# ---------- stock movement (super-admin only) ----------

@drug_router.post("/{drug_id}/stock-in")
def stock_in(
    drug_id: int,
    data: StockInRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(SUPER_ADMIN),
):
    drug, error = manager.stock_in(
        drug_id, data.amount, performed_by=current_user["uid"],
        session=session, reason=data.reason,
    )
    if error == "not_found":
        raise HTTPException(status_code=404, detail="Drug not found")
    if error == "invalid_amount":
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    return drug


@drug_router.post("/{drug_id}/adjust")
def adjust_stock(
    drug_id: int,
    data: AdjustRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(SUPER_ADMIN),
):
    # NOTE: performed_by and approved_by are both the current user here,
    # because the system has one super-admin role. If the clinic wants a
    # genuine second signature, approved_by needs to come from a separate
    # approval step — worth confirming with the client.
    drug, error = manager.adjust_stock(
        drug_id, data.new_count, data.reason,
        performed_by=current_user["uid"],
        approved_by=current_user["uid"],
        session=session,
    )
    if error == "not_found":
        raise HTTPException(status_code=404, detail="Drug not found")
    if error == "reason_required":
        raise HTTPException(status_code=400, detail="A reason is required for an adjustment")
    if error == "invalid_count":
        raise HTTPException(status_code=400, detail="Count cannot be negative")
    return drug
