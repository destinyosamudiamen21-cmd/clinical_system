from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import RoleChecker, get_current_user
from services.amendment_manager import AmendmentManager
from models.amendment import AmendmentCreate

amendment_router = APIRouter()
manager = AmendmentManager()


@amendment_router.post("/")
def create_amendment(
    data: AmendmentCreate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["doctor", "nurse", "admin"]))
):
    amendment = manager.create(data, created_by=current_user["uid"], session=session)
    if not amendment:
        raise HTTPException(status_code=400, detail="Invalid document type")
    return amendment


@amendment_router.get("/{document_type}/{document_id}")
def get_amendments(
    document_type: str,
    document_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    return manager.get_for_document(document_type, document_id, session)
