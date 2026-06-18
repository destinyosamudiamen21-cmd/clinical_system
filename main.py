from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.appointment_r import appointment_router
from routes.patient_routes import patient_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],

)

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



