from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
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
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", include_in_schema=False)
def home(request: Request):
    with open("templates/home.html", "r") as file:
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



