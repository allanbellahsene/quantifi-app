# dependencies.py
from fastapi import Depends
from sqlalchemy.orm import Session
from .database import get_db
from .services import UserService, BacktestService

def get_user_service(db: Session = Depends(get_db)):
    return UserService(db)

def get_backtest_service(db: Session = Depends(get_db)):
    return BacktestService(db)