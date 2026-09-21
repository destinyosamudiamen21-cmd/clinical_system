# services/drug_manager.py
import re
from datetime import datetime, UTC
from sqlmodel import Session, select, or_

from models.drugs import Drug, DrugCreate, DrugUpdate, StockTransaction


def derive_search_name(name: str) -> str:
    """Strip the bracketed part so 'CLAMIDE (GLIBENCLOMIDE 5MG)' searches as 'CLAMIDE'."""
    base = re.sub(r"[\(\[][^\)\]]*[\]\)]", "", name).strip()
    return re.sub(r"\s{2,}", " ", base) or name


class DrugManager:

    # ---------- reading ----------

    def list_drugs(self, session: Session, category=None, low_stock_only=False,
                   needs_review_only=False):
        statement = select(Drug).where(Drug.is_active == True)
        if category:
            statement = statement.where(Drug.category == category)
        if needs_review_only:
            statement = statement.where(Drug.needs_review == True)
        drugs = session.exec(statement.order_by(Drug.name)).all()

        if low_stock_only:
            # Filtered in Python, not SQL: comparing two columns where one is
            # nullable is awkward in SQL, and the catalogue is a few hundred
            # rows, not millions.
            drugs = [d for d in drugs
                     if d.reorder_level is not None and d.quantity <= d.reorder_level]
        return drugs

    def search_drugs(self, term: str, session: Session):
        """Matches brand name, bracket-stripped name, or generic."""
        like = f"%{term}%"
        return session.exec(
            select(Drug).where(
                Drug.is_active == True,
                or_(
                    Drug.name.ilike(like),
                    Drug.search_name.ilike(like),
                    Drug.generic.ilike(like),
                ),
            ).order_by(Drug.name)
        ).all()

    def get_drug(self, drug_id: int, session: Session):
        return session.get(Drug, drug_id)

    def get_transactions(self, drug_id: int, session: Session):
        return session.exec(
            select(StockTransaction)
            .where(StockTransaction.drug_id == drug_id)
            .order_by(StockTransaction.created_at.desc())
        ).all()

    # ---------- writing ----------

    def create_drug(self, data: DrugCreate, session: Session):
        drug = Drug(
            name=data.name,
            search_name=data.search_name or derive_search_name(data.name),
            generic=data.generic,
            category=data.category,
            reorder_level=data.reorder_level,
            unit_cost=data.unit_cost,
            quantity=0,          # stock only enters via a transaction
        )
        session.add(drug)
        session.commit()
        session.refresh(drug)
        return drug

    def update_drug(self, drug_id: int, data: DrugUpdate, session: Session):
        drug = session.get(Drug, drug_id)
        if not drug:
            return None

        # exclude_unset: only apply fields the client actually sent, so a form
        # that omits unit_cost doesn't wipe an existing cost.
        changes = data.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(drug, field, value)

        # Keep search_name in step with the name, unless it was set explicitly.
        if "name" in changes:
            drug.search_name = derive_search_name(drug.name)

        # Any edit is the super-admin confirming this entry, so the
        # suspected-typo flag has done its job and clears.
        drug.needs_review = False

        session.add(drug)
        session.commit()
        session.refresh(drug)
        return drug

    def archive_drug(self, drug_id: int, session: Session):
        """Soft delete — a discontinued drug still appears in past dispensing records."""
        drug = session.get(Drug, drug_id)
        if not drug:
            return None
        drug.is_active = False
        session.add(drug)
        session.commit()
        session.refresh(drug)
        return drug

    def restore_drug(self, drug_id: int, session: Session):
        drug = session.get(Drug, drug_id)
        if not drug:
            return None
        drug.is_active = True
        session.add(drug)
        session.commit()
        session.refresh(drug)
        return drug

    # ---------- stock movement ----------

    def _move_stock(self, drug: Drug, change: int, transaction_type: str,
                    performed_by, session: Session, reason=None,
                    approved_by=None, prescription_id=None):
        """
        The ONLY path that changes a quantity. Writes the new total and the
        transaction that explains it in the same commit, so the two can never
        drift apart.
        """
        before = drug.quantity
        after = before + change

        drug.quantity = after
        session.add(drug)
        session.add(StockTransaction(
            drug_id=drug.id,
            transaction_type=transaction_type,
            change=change,
            quantity_before=before,
            quantity_after=after,
            reason=reason,
            performed_by=performed_by,
            approved_by=approved_by,
            prescription_id=prescription_id,
        ))
        session.commit()
        session.refresh(drug)
        return drug

    def stock_in(self, drug_id: int, amount: int, performed_by, session: Session,
                 reason=None):
        """New stock arriving. Adds to whatever is already there."""
        if amount <= 0:
            return None, "invalid_amount"
        drug = session.get(Drug, drug_id)
        if not drug:
            return None, "not_found"
        return self._move_stock(drug, amount, "stock_in", performed_by,
                                session, reason=reason), None

    def adjust_stock(self, drug_id: int, new_count: int, reason: str,
                     performed_by, approved_by, session: Session):
        """
        Correct the system to match a physical count. Records the difference
        as a signed transaction with a reason and an approver — the count is
        never silently overwritten.
        """
        if not reason or not reason.strip():
            return None, "reason_required"
        if new_count < 0:
            return None, "invalid_count"
        drug = session.get(Drug, drug_id)
        if not drug:
            return None, "not_found"

        change = new_count - drug.quantity
        if change == 0:
            return drug, None      # nothing to record

        return self._move_stock(drug, change, "adjustment", performed_by,
                                session, reason=reason,
                                approved_by=approved_by), None

    def dispense(self, drug_id: int, amount: int, performed_by, session: Session,
                 prescription_id=None):
        """
        Called by the pharmacy when drugs are handed over. Refuses if stock
        would go negative — you cannot dispense what you do not have.
        """
        if amount <= 0:
            return None, "invalid_amount"
        drug = session.get(Drug, drug_id)
        if not drug:
            return None, "not_found"
        if drug.quantity < amount:
            return None, "insufficient_stock"

        return self._move_stock(drug, -amount, "dispense", performed_by,
                                session, prescription_id=prescription_id), None
