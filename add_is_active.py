from sqlmodel import Session, text
from storage.database import engine

with Session(engine) as session:
    session.exec(text("ALTER TABLE patient ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE"))
    session.commit()

print("Done")