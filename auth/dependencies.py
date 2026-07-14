from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException
from auth.security import decode_access_token

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