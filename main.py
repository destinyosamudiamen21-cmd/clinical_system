from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager
from storage.database import create_db_and_tables,engine
from routes.appointment_r import appointment_router
from routes.patient_routes import patient_router
from auth.routes import auth_router
from routes.consultation_f_routes import consult_routes
from routes.pin_routes import payment_router

@asynccontextmanager
async def lifespan(app):
    create_db_and_tables()
    yield
    engine.dispose()

app = FastAPI(lifespan=lifespan, redirect_slashes=False)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", include_in_schema=False)
def home(request: Request):
    with open("templates/home.html", "r") as file:
        return HTMLResponse(content=file.read())
    
@app.get("/patients", include_in_schema=False)
def patient():
    with open("templates/patients.html", "r") as file:
        return HTMLResponse(content=file.read())
    
@app.get("/appointments", include_in_schema=False)
def appointments():
    with open("templates/appointments.html", "r") as file:
        return HTMLResponse(content=file.read())

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

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["auth"]
)

app.include_router(
    consult_routes,
    prefix="/consultation_fee",
    tags=["Consultation fee"]
)

app.include_router(
    payment_router,
    prefix="/payment",
    tags=["payment"]
)

