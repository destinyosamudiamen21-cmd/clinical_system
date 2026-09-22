import secrets
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from models.prescription import Prescription
from models.medication_chart import MedicationChart   # match actual model name
from datetime import datetime, UTC
from models.medication_chart import MedicationChart
from models.drugs import Drug,StockTransaction
from services.drugs_manager import DrugManager



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
    
    def get_dispensing_view(self, encounter_id: int, session: Session):
        """
        The medication list a pharmacist works from: each drug plus its
        current stock level, so they can see what they can actually give
        before typing anything.
        """
        meds = session.exec(
            select(MedicationChart).where(MedicationChart.encounter_id == encounter_id)
        ).all()

        rows = []
        for m in meds:
            stock = None
            if m.drug_id:
                drug = session.get(Drug, m.drug_id)
                stock = drug.quantity if drug else None

            rows.append({
                "id": m.id,
                "drug_id": m.drug_id,
                "drug": m.drug,
                "dose": m.dose,
                "route": m.route,
                "frequency": m.frequency,
                "start_date": m.start_date,
                "stop_date": m.stop_date,
                "quantity_dispensed": m.quantity_dispensed,
                "is_dispensed": m.is_dispensed,
                # None means "not linked to the catalogue" — the pharmacist can
                # still hand it over, the system just can't deduct stock for it.
                "stock_available": stock,
            })
        return rows

    def dispense_prescription(self, prescription_id: int, items: list,
                              performed_by, session: Session):
        """
        Dispense one or more medications from a prescription.

        items: [{"medication_id": 4, "quantity": 30}, ...]
               Only the drugs actually being handed over are included. Anything
               the pharmacist leaves out stays outstanding, which is how partial
               dispensing works — no separate mode for it.

        Returns (result, error). Nothing is committed unless every requested
        item can be satisfied.
        """
        prescription = session.get(Prescription, prescription_id)
        if not prescription:
            return None, "not_found"
        if prescription.is_dispensed:
            return None, "already_dispensed"
        if not items:
            return None, "nothing_to_dispense"

        # --- Validate everything BEFORE changing anything ---
        # A half-applied dispense would leave stock wrong with no way to tell
        # which drugs went out. Check the whole batch first, then apply.
        planned = []
        for item in items:
            med = session.get(MedicationChart, item.get("medication_id"))
            if not med or med.encounter_id != prescription.encounter_id:
                return None, "invalid_medication"

            quantity = item.get("quantity")
            if quantity is None or quantity <= 0:
                return None, "invalid_quantity"

            drug = None
            if med.drug_id:
                drug = session.get(Drug, med.drug_id)
                if not drug:
                    return None, "drug_not_found"
                if drug.quantity < quantity:
                    # Names the drug so the pharmacist knows which one is short
                    return None, f"insufficient_stock:{drug.name}"

            planned.append((med, drug, quantity))

        # --- Apply ---
        for med, drug, quantity in planned:
            if drug:
                before = drug.quantity
                after = before - quantity
                drug.quantity = after
                session.add(drug)
                session.add(StockTransaction(
                    drug_id=drug.id,
                    transaction_type="dispense",
                    change=-quantity,
                    quantity_before=before,
                    quantity_after=after,
                    performed_by=performed_by,
                    prescription_id=prescription.id,
                ))

            med.quantity_dispensed += quantity
            med.is_dispensed = True
            session.add(med)

        # The prescription is complete only when every drug on it has gone out.
        # Until then the code stays valid, so the patient can come back for the
        # rest without needing a new slip.
        all_meds = session.exec(
            select(MedicationChart).where(
                MedicationChart.encounter_id == prescription.encounter_id
            )
        ).all()
        if all(m.is_dispensed for m in all_meds):
            prescription.is_dispensed = True
            prescription.dispensed_by = performed_by
            prescription.dispensed_at = datetime.now(UTC)
            session.add(prescription)

        session.commit()

        return {
            "dispensed": len(planned),
            "prescription_complete": prescription.is_dispensed,
            "outstanding": sum(1 for m in all_meds if not m.is_dispensed),
        }, None
