import secrets
from datetime import datetime, timedelta, UTC
from sqlmodel import Session, select
from models.password_reset import PasswordResetToken
from auth.model import User
from auth.security import generate_password_hash

class PasswordResetManager:
    def create_token(self, user: User, session: Session):
        token = secrets.token_urlsafe(32)
        reset = PasswordResetToken(
            token=token,
            user_id=user.uid,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
        session.add(reset)
        session.commit()
        session.refresh(reset)
        return reset

    def get_valid_token(self, token: str, session: Session):
        record = session.exec(
            select(PasswordResetToken).where(
                PasswordResetToken.token == token,
                PasswordResetToken.is_used == False,
            )
        ).first()
        if not record:
            return None
        if record.expires_at < datetime.now(UTC):   # expired
            return None
        return record

    def reset_password(self, record: PasswordResetToken, new_password: str, session: Session):
        user = session.get(User, record.user_id)
        if not user:
            return None
        user.hashed_password = generate_password_hash(new_password)
        record.is_used = True                # consume the token
        session.add(user)
        session.add(record)
        session.commit()
        return user
