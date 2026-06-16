from fastapi import FastAPI

from routes.appointment_r import appointment_router
from routes.patient_routes import patient_router


app = FastAPI()

@app.get("/")
def home():
    return{"message": "Clincal system"}

app.include_router(
    patient_router,
    prefix="/patient",
    tags= ["Patients"]
)

app.include_router(
    appointment_router,
    prefix="/appointment",
    tags= ["Appointment"]
)



