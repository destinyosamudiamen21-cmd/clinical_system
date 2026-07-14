from fastapi import APIRouter, Depends
from sqlmodel import Session
from fastapi.exceptions import HTTPException
from storage.database import get_session
from auth.services import UserManager
from auth.model import UserCreate


auth_router = APIRouter()

manager = UserManager()

@auth_router.post("/signup")
def create_user_account(user_data: UserCreate, session:Session = Depends(get_session)):
    existing_user = manager.get_user_by_email(user_data.email, session)
    if existing_user:
        raise HTTPException(status_code=403, detail="User with this email already exists")
    new_user = manager.create_account(user_data, session)
    return new_user