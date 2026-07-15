from fastapi import APIRouter, HTTPException,Depends
from services.consul_fee_manager import FeeManager
from models.consultation_fee import ConsultationFeeUpdate
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import RoleChecker

consult_routes = APIRouter()
manager = FeeManager()

@consult_routes.get("/")
def get_current_fee(session: Session= Depends(get_session), current_user = Depends(RoleChecker(["admin"]))):
    return manager.get_fee(session)

@consult_routes.post("/")
def set_fee(fee_data: ConsultationFeeUpdate, session: Session=Depends(get_session), current_user=Depends(RoleChecker(["admin"]))):
    return manager.set_fee(fee_data.amount, session)
