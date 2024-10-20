# backtest/core/jwt_token.py
import os

from dotenv     import load_dotenv
from jose       import JWTError, jwt
from datetime   import datetime, timedelta, timezone

from fastapi            import Depends, HTTPException, status, Request, Response
from fastapi.security   import OAuth2PasswordBearer

# Secret key to encode/decode the JWT
load_dotenv()                           # Load environment variables from .env file
SECRET_KEY  = os.getenv("SECRET_KEY")   # Get the database URL from the environment variables
ALGORITHM   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme   = OAuth2PasswordBearer(tokenUrl="token")

###################################################################################################
""" Token Verification """
###################################################################################################

# Function to create an access token
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

# Function to decode the access token
def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    # Here you would fetch the user from the DB if needed
    return {"email": email}
    
###################################################################################################
""" Generate token """
###################################################################################################

def set_cookie_token(response: Response, email: str):
    # Create JWT token for the user
    access_token    = create_access_token(data={"sub": email})

    # Set token as HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,  # Set to True in production
        samesite="Strict",  # or "Lax" to balance security and usability
        path="/",  # Make the cookie accessible to all paths
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
 
###################################################################################################
""" Secure User Authentication """
###################################################################################################

def get_current_user(request: Request):
    # Extract the token from the 'access_token' cookie
    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify the token
    return decode_access_token(token)