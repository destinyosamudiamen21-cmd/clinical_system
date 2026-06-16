# from sqlmodel import SQLModel, Field
# from typing import Optional
from dataclasses import dataclass

# class Patient(SQLModel, table=True):
    
#     id: Optional[int] = Field(
#         default=None, 
#         primary_key=True
#     )


@dataclass 
class Patient:
    patient_id: str
    full_name: str
    age: int
    gender: str

    phone_number: str
    address: str
    diagnosis: str

    nationality: str
    tribe: str
    occupation: str
    marital_status : str
    next_of_kin : str





