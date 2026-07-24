from fastapi import APIRouter, Depends
from sqlmodel import Session
from fastapi.exceptions import HTTPException
from storage.database import get_session
from auth.services import UserManager
from auth.model import UserCreate,UserRead
from auth.model import Userlogin
from auth.security import verify_password_hash, create_access_token
from auth.dependencies import get_current_user
from auth.dependencies import RoleChecker
from pydantic import BaseModel, EmailStr
from services.password_reset_s import PasswordResetManager
from services.email_services import send_reset_email
from config.config import config


auth_router = APIRouter()

manager = UserManager()
reset_manager = PasswordResetManager()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


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
    
@auth_router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return{"message": "You are authenticated", "user": current_user}

@auth_router.get("/admin-test")
def admin_test(user:dict = Depends(RoleChecker(["admin"]))):
    return {"message": "You are an admin", "user": user}

@auth_router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, session: Session = Depends(get_session)):
    user = manager.get_user_by_email(data.email, session)   # reuse your existing method

    if user:
        record = reset_manager.create_token(user, session)
        link = f"{config.FRONTEND_URL}/reset-password?token={record.token}"
        try:
            send_reset_email(user.email, link)
        except Exception:
            print(f"EMAIL SEND FAILED: {"e"}")
          # don't leak whether sending succeeded

    # ALWAYS the same response, whether or not the email exists
    return {"message": "If that email is registered, a reset link has been sent."}


@auth_router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, session: Session = Depends(get_session)):
    record = reset_manager.get_valid_token(data.token, session)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = reset_manager.reset_password(record, data.new_password, session)
    if not user:
        raise HTTPException(status_code=400, detail="Could not reset password")

    return {"message": "Password reset successful. You can now log in."}