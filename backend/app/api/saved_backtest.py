# api/saved_backtest.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from .auth import get_current_user, User
from ..models.saved_backtest import SavedBacktest
import logging

logger = logging.getLogger(__name__)

# Temporary in-memory storage
saved_backtests_db = {}

router = APIRouter(prefix="/api/backtests", tags=["backtests"])

# Temporary in-memory storage
saved_backtests_db = {}

router = APIRouter(prefix="/api/backtests", tags=["backtests"])

@router.post("/save")
async def save_backtest(
    backtest_data: SavedBacktest,
    current_user: User = Depends(get_current_user)
):
    try:
        # Create a copy of the backtest data to modify
        backtest_dict = backtest_data.dict()
        
        # Set the user_id from the authenticated user
        backtest_dict["user_id"] = current_user.username
        
        # Update timestamps
        backtest_dict["last_updated"] = datetime.now().isoformat()
        
        # Create a unique key for the backtest
        backtest_key = f"{current_user.username}_{backtest_data.backtest_name}"
        
        if backtest_key not in saved_backtests_db:
            backtest_dict["created_at"] = backtest_dict["last_updated"]
        
        # Save the backtest
        saved_backtests_db[backtest_key] = backtest_dict
        
        return {"message": "Backtest saved successfully"}
    except Exception as e:
        logger.error(f"Error saving backtest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=List[SavedBacktest])
async def list_backtests(current_user: User = Depends(get_current_user)):
    try:
        # Filter backtests for current user
        user_backtests = [
            backtest for key, backtest in saved_backtests_db.items()
            if key.startswith(f"{current_user.username}_")
        ]
        return user_backtests
    except Exception as e:
        logger.error(f"Error listing backtests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{backtest_name}", response_model=SavedBacktest)
async def get_backtest(
    backtest_name: str,
    current_user: User = Depends(get_current_user)
):
    try:
        backtest_key = f"{current_user.username}_{backtest_name}"
        backtest = saved_backtests_db.get(backtest_key)
        if not backtest:
            raise HTTPException(status_code=404, detail="Backtest not found")
        return backtest
    except Exception as e:
        logger.error(f"Error retrieving backtest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))