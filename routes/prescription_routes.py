from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from storage.database import get_session
from auth.dependencies import get_current_user, RoleChecker
from models.encounter import Encounter
from services.prescription_manager import PrescriptionManager
from services.patient_manager import PatientManager

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
