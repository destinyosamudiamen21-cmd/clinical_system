# import_drugs.py  — run ONCE from your project root, after the migration.
#
#   python3 import_drugs.py drugs_import.csv
#
# Safe to re-run: it skips any drug whose name is already in the table,
# so a half-finished import can be resumed without creating duplicates.

import csv
import sys
from sqlmodel import Session, select, create_engine

from config.config import config          # match your project's import paths
from models.drugs import Drug


def to_int(value):
    value = (value or "").strip()
    return int(value) if value else None


def to_float(value):
    value = (value or "").strip()
    return float(value) if value else None


def main(csv_path: str):
    engine = create_engine(config.DATABASE_URL)

    added = skipped = 0
    with Session(engine) as session, open(csv_path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            name = row["name"].strip()
            if not name:
                continue

            exists = session.exec(select(Drug).where(Drug.name == name)).first()
            if exists:
                skipped += 1
                continue

            session.add(Drug(
                name=name,                              # verbatim
                search_name=row["search_name"].strip() or name,
                generic=row["generic"].strip() or None,
                category=row["category"].strip() or "Tablet/Capsule",
                quantity=0,                             # stock enters via transactions only
                reorder_level=to_int(row.get("reorder_level")),
                unit_cost=to_float(row.get("unit_cost")),
            ))
            added += 1

        session.commit()

    print(f"Added:   {added}")
    print(f"Skipped: {skipped} (already present)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python3 import_drugs.py drugs_import.csv")
        sys.exit(1)
    main(sys.argv[1])
