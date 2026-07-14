import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from config.config import config



def generate_password_hash(password: str) -> str:
    pw_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pw_bytes, salt)
    return hashed.decode("utf-8")

def verify_password_hash(password: str, hash: str) -> bool:
    pw_bytes = password.encode("utf-8")
    hash_bytes = hash.encode("utf-8")
    return bcrypt.checkpw(pw_bytes, hash_bytes)

def create_access_token(user_data:dict, expiry: timedelta = None):
    payload = {
        "user": user_data,
        "exp": datetime.now(timezone.utc) + (expiry if expiry is not None else timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES))
    }

    token = jwt.encode(
        payload=payload,
        key=config.JWT_SECRET,
        algorithm=config.JWT_ALGORITHM
    )
    return token

def decode_access_token(token:str):
    try:
        token_data = jwt.decode(
            jwt=token,
            key=config.JWT_SECRET,
            algorithms=[config.JWT_ALGORITHM]
        )
        return token_data
    except jwt.PyJWTError:
        return None
