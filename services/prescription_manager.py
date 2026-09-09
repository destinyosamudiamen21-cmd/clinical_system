import secrets
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from models.prescription import Prescription
from models.medication_chart import MedicationChart   # match actual model name


class PrescriptionManager:

    def create_for_encounter(self, encounter_id: int, created_by, session: Session):
        # One active prescription per encounter, return the existing one if present,
        # so re saving medications doesn't issue a second code for the same visit.
        existing = session.exec(
            select(Prescription).where(
                Prescription.encounter_id == encounter_id,
                Prescription.is_dispensed == False,
            )
        ).first()
        if existing:
            return existing

        code = secrets.token_hex(3).upper()      # 6 hex chars, e.g. "A3F9C1"
        prescription = Prescription(
            encounter_id=encounter_id,
            code=code,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            created_by=created_by,
        )
        session.add(prescription)
        session.commit()
        session.refresh(prescription)
        return prescription

    def get_by_code(self, code: str, session: Session):
        prescription = session.exec(
            select(Prescription).where(Prescription.code == code.upper())
        ).first()
        if not prescription:
            return None, "not_found"
        if prescription.is_dispensed:
            return None, "already_dispensed"
        if prescription.expires_at < datetime.now(UTC):
            return None, "expired"
        return prescription, None

    def get_medications(self, encounter_id: int, session: Session):
        return session.exec(
            select(MedicationChart).where(MedicationChart.encounter_id == encounter_id)
        ).all()
    
    def get_for_encounter(self, encounter_id: int, session: Session):
        return session.exec(
            select(Prescription).where(Prescription.encounter_id == encounter_id)
        ).first()
