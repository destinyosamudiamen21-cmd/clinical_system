import bcrypt


def generate_password_hash(password: str) -> bool:
    pw_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pw_bytes, salt)
    return hashed.decode("utf-8")

def verify_password_hash(password: str, hash: str) -> str:
    pw_bytes = password.encode("utf-8")
    hash_bytes = hash.encode("utf-8")
    return bcrypt.checkpw(pw_bytes, hash_bytes)

