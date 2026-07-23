from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import RoleChecker, get_current_user
from services.fluid_manager import FluidManager
from models.Fluid_bal_chart import FluidCreate


fluid_router = APIRouter()

fluid_mgr = FluidManager()


@fluid_router.post("/")
def create_fluid(
    data: FluidCreate, 
    session: Session = Depends(get_session),     
    current_user: dict = Depends(RoleChecker(["nurse", "doctor", "admin"]))):
    return fluid_mgr.create(data, recorded_by=current_user["uid"], session=session)

@fluid_router.get("/{encounter_id}")
def get_fluid(
    encounter_id: int, 
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)):
    return fluid_mgr.get_for_encounter(encounter_id, session)
