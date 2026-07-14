from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException
from auth.security import decode_access_token
from typing import List

bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    #pull the token string out of the header
    token = credentials.credentials
    #verify and decode it 
    token_data = decode_access_token(token)
    if token_data is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    #return the user info from the payload
    return token_data["user"]

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action"
            )
        return current_user
        