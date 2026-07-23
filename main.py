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
from routes.encounter_r import encounter_router
from routes.clerking_routes import clerking_router
from routes.vital_routes import vital_router
from routes.procedure_routes import procedure_router
from routes.progress_routes import progress_router
from routes.fluid_bal_routes import fluid_router
from routes.medication_routes import medication_router
from routes.nursing_routes import nursing_router
from routes.discharge_route import discharge_router


@asynccontextmanager
async def lifespan(app):
    create_db_and_tables()
    yield
    engine.dispose()

app = FastAPI(lifespan=lifespan, redirect_slashes=False)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/login")
def login_page(request:Request):
    with open("templates/login.html") as file:
        return HTMLResponse(content=file.read())


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
    
@app.get("/encounter-detail/{encounter_id}", include_in_schema=False)
def encounter_detail_page(encounter_id: int):
    with open("templates/encounter_detail.html") as file:
        return HTMLResponse(content=file.read())
    
@app.get("/encounter-page/{patient_id}", include_in_schema=False)
def encounter_detail_page(patient_id: int):
    with open("templates/encounters.html") as file:
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

app.include_router(
    encounter_router,
    prefix="/encounter",
    tags=["encounter"]
)
app.include_router(
    clerking_router,
    prefix="/clerking", 
    tags=["clerking"])

app.include_router(
    vital_router, 
    prefix="/vitals", 
    tags=["vitals"])

app.include_router(
    nursing_router, 
    prefix="/nursing", 
    tags=["nursing"])

app.include_router(
    progress_router, 
    prefix="/progress", 
    tags=["progress"])

app.include_router(
    medication_router, 
    prefix="/medication", 
    tags=["medication"])

app.include_router(
    fluid_router, 
    prefix="/fluid", 
    tags=["fluid"])

app.include_router(
    procedure_router, 
    prefix="/procedure", 
    tags=["procedure"])

app.include_router(
    discharge_router, 
    prefix="/discharge", 
    tags=["discharge"])