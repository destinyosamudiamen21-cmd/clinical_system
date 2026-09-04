from sqlmodel import Session, select
from models.amendment import Amendment, AmendmentCreate

# Only these document types can be amended — guards against typos and
# against a client inventing a type that doesn't exist.
ALLOWED_TYPES = {"clerking", "progress", "investigation"}


class AmendmentManager:
    def create(self, data: AmendmentCreate, created_by, session: Session):
        if data.document_type not in ALLOWED_TYPES:
            return None                      # route turns this into a 400
        amendment = Amendment(**data.model_dump(), created_by=created_by)
        session.add(amendment)
        session.commit()
        session.refresh(amendment)
        return amendment

    def get_for_document(self, document_type: str, document_id: int, session: Session):
        return session.exec(
            select(Amendment)
            .where(
                Amendment.document_type == document_type,
                Amendment.document_id == document_id,
            )
            .order_by(Amendment.created_at)   # oldest first — chronological trail
        ).all()
