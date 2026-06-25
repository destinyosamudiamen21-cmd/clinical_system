from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from storage.database import create_db_and_tables,engine
from routes.appointment_r import appointment_router
from routes.patient_routes import patient_router




@asynccontextmanager
async def lifespan(app):
    create_db_and_tables()
    yield
    engine.dispose()

app = FastAPI(lifespan=lifespan)



@app.get("/", include_in_schema=False)
def home(request: Request):
    return {"clinic:" "Restore medical Center"}


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



