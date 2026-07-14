from fastapi import APIRouter, Depends
from sqlmodel import Session
from fastapi.exceptions import HTTPException
from storage.database import get_session
from auth.services import UserManager
from auth.model import UserCreate,UserRead
from auth.model import Userlogin
from auth.security import verify_password_hash, create_access_token


auth_router = APIRouter()

manager = UserManager()

@auth_router.post("/signup", response_model=UserRead)
def create_user_account(user_data: UserCreate, session:Session = Depends(get_session)):
    existing_user = manager.get_user_by_email(user_data.email, session)
    if existing_user:
        raise HTTPException(status_code=403, detail="User with this email already exists")
    new_user = manager.create_account(user_data, session)
    return new_user

@auth_router.post("/login")
def login_user(login_data: Userlogin, session:Session = Depends(get_session)):
    #find user by email
    user = manager.get_user_by_email(login_data.email, session)
    #if no user, OR password worng 
    if user is None:
        raise HTTPException(status_code=403, detail="Invalid email or password")
    
    password_correct = verify_password_hash(login_data.password, user.hashed_password)
    if not password_correct:
        raise HTTPException(status_code=403, detail="Invalid email or password")
    
    #if password is correct and credential is good, create token
    token = create_access_token({
        "email": user.email,
        "uid": str(user.uid),
        "role": user.role
    })
    return {"access_token": token, "token_type": "bearer"}
    
