# app/api/auth.py

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Set
import logging

# Initialize the logger
logger = logging.getLogger(__name__)

# Allowlist of authorized emails
AUTHORIZED_EMAILS: Set[str] = {
    "test@example.com",
    "admin@quantifi.com",
    # Add more authorized emails here
}


# Configuration constants
SECRET_KEY = "your-secret-key"  # Replace with a secure key in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create a fresh hash for 'testpassword'
test_password_hash = pwd_context.hash("testpassword")

# Update fake users database with the fresh hash
fake_users_db: Dict[str, dict] = {
    "testuser": {
        "username": "testuser",
        "email": "test@example.com",
        "hashed_password": test_password_hash,
    }
}

# Print the hash for verification
print(f"Test user password hash: {test_password_hash}")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class User(BaseModel):
    username: str
    email: EmailStr

class UserInDB(User):
    hashed_password: str

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Helper functions
def verify_password(plain_password, hashed_password):
    logger.info(f"Attempting to verify password")
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        logger.info(f"Password verification result: {result}")
        return result
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)

def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Authentication middleware
async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Admin endpoints for managing authorized emails
@router.post("/admin/authorize-email")
async def authorize_email(email: EmailStr, current_user: User = Depends(get_current_user)):
    # In production, add proper admin role checking
    if current_user.email != "admin@quantifi.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action"
        )
    AUTHORIZED_EMAILS.add(email)
    return {"message": f"Email {email} has been authorized"}

@router.get("/admin/authorized-emails")
async def get_authorized_emails(current_user: User = Depends(get_current_user)):
    # In production, add proper admin role checking
    if current_user.email != "admin@quantifi.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to perform this action"
        )
    return {"authorized_emails": list(AUTHORIZED_EMAILS)}

# User registration and authentication endpoints
@router.post("/register")
async def register(user: UserRegister):
    logger.info(f"Registration attempt for email: {user.email}")  # Add logging
    
    # Check if email is in the allowlist
    if user.email not in AUTHORIZED_EMAILS:
        logger.warning(f"Unauthorized email registration attempt: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Email {user.email} is not authorized for registration. Please contact administrator."
        )
    
    # Check if username already exists
    if user.username in fake_users_db:
        logger.warning(f"Duplicate username registration attempt: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user.username}' is already registered"
        )
    
    # Check if email is already registered
    if any(u["email"] == user.email for u in fake_users_db.values()):
        logger.warning(f"Duplicate email registration attempt: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{user.email}' is already registered"
        )
    
    try:
        # Create new user
        hashed_password = get_password_hash(user.password)
        fake_users_db[user.username] = {
            "username": user.username,
            "email": user.email,
            "hashed_password": hashed_password,
        }
        
        logger.info(f"Successfully registered new user: {user.username} ({user.email})")
        return {"message": "User registered successfully"}
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.get("/debug/check-email/{email}")
async def check_email_authorization(email: str):
    return {
        "email": email,
        "is_authorized": email in AUTHORIZED_EMAILS,
        "authorized_emails": list(AUTHORIZED_EMAILS)
    }

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    logger.info(f"Login attempt for username: {form_data.username}")
    logger.info(f"Current users in db: {list(fake_users_db.keys())}")
    
    # First check if user exists
    if form_data.username not in fake_users_db:
        logger.warning(f"User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user and verify password
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Invalid password for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    logger.info(f"Successful login for user: {user.username}")
    return {"access_token": access_token, "token_type": "bearer"}