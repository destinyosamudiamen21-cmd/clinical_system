from fastapi.exceptions import HTTPException
from auth.security import generate_password_hash
from sqlmodel import Session, select
from auth.model import User, UserCreate


class UserManager():

    def get_user_by_email(self, email:str, session:Session ):
        statement = select(User).where(User.email == email)
        result = session.exec(statement)
        return result.first()

    def create_account(self, user_data:UserCreate, session: Session ):
        hashed = generate_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            role= user_data.role,
            hashed_password=hashed
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return new_user

