# backtest/core/dependencies.py
from jose               import JWTError
from fastapi            import Depends, HTTPException, status
from fastapi.security   import OAuth2PasswordBearer

from core.jwt_token import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


"""
# dependencies.py
from fastapi import Depends
from sqlalchemy.orm import Session
from .database import get_db
from .services import UserService, BacktestService

def get_user_service(db: Session = Depends(get_db)):
    return UserService(db)

def get_backtest_service(db: Session = Depends(get_db)):
    return BacktestService(db)
"""