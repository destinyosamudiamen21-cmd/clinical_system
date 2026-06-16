from dataclasses import dataclass
# from datetime import datetime

@dataclass
class Appointment:

    appointment_id: str

    patient_id: str

    appointment_data: str

    doctor_name: str

    reason: str

    status: str