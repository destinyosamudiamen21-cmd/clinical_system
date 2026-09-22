from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import get_current_user, RoleChecker
from models.encounter import Encounter
from services.prescription_manager import PrescriptionManager
from services.patient_manager import PatientManager
from typing import List
from pydantic import BaseModel


prescription_router = APIRouter()
manager = PrescriptionManager()
patient_manager = PatientManager()


@prescription_router.get("/encounter/{encounter_id}")
def get_for_encounter(
    encounter_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    return manager.get_for_encounter(encounter_id, session)


@prescription_router.get("/search-patient")
def search_patient(
    name: str,
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["pharmacy", "admin"]))
):
    patients = patient_manager.search_by_name(name, session)
    # Only the fields the pharmacy needs to identify the right person
    return [
        {
            "id": p.id,
            "full_name": p.full_name,
            "age": p.age,
            "phone_number": p.phone_number,
        }
        for p in patients
    ]


@prescription_router.post("/lookup")
def lookup_prescription(
    data: dict,
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["pharmacy", "admin"]))
):
    patient_id = data.get("patient_id")
    code = data.get("code", "")

    prescription, reason = manager.get_by_code(code, session)

    if reason == "not_found":
        raise HTTPException(status_code=404, detail="No prescription found for that code")
    if reason == "expired":
        raise HTTPException(status_code=400, detail="This prescription code has expired")
    if reason == "already_dispensed":
        raise HTTPException(status_code=400, detail="This prescription has already been dispensed")

    # Confirm the code actually belongs to the selected patient
    encounter = session.get(Encounter, prescription.encounter_id)
    if not encounter or encounter.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="No prescription found for that code")

    medications = manager.get_medications(prescription.encounter_id, session)
    return {"prescription_id": prescription.id, "medications": medications}

class DispenseItem(BaseModel):
    medication_id: int
    quantity: int


class DispenseRequest(BaseModel):
    prescription_id: int
    items: List[DispenseItem]


@prescription_router.get("/dispensing/{encounter_id}")
def dispensing_view(
    encounter_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["pharmacy", "admin", "super_admin"]))
):
    return manager.get_dispensing_view(encounter_id, session)


@prescription_router.post("/dispense")
def dispense(
    data: DispenseRequest,
    session: Session = Depends(get_session),
    current_user: dict = Depends(RoleChecker(["pharmacy", "admin", "super_admin"]))
):
    result, error = manager.dispense_prescription(
        data.prescription_id,
        [item.model_dump() for item in data.items],
        performed_by=current_user["uid"],
        session=session,
    )

    if error == "not_found":
        raise HTTPException(status_code=404, detail="Prescription not found")
    if error == "already_dispensed":
        raise HTTPException(status_code=400, detail="This prescription has already been fully dispensed")
    if error == "nothing_to_dispense":
        raise HTTPException(status_code=400, detail="Enter a quantity for at least one drug")
    if error == "invalid_medication":
        raise HTTPException(status_code=400, detail="A drug on this request does not belong to this prescription")
    if error == "invalid_quantity":
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
    if error == "drug_not_found":
        raise HTTPException(status_code=404, detail="Drug not found in the catalogue")
    if error and error.startswith("insufficient_stock:"):
        drug_name = error.split(":", 1)[1]
        raise HTTPException(status_code=409, detail=f"Insufficient stock: {drug_name}")

    return result

