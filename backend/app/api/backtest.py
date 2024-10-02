from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from typing import List
from datetime import datetime
from app.services.backtest_service import run_backtest_with_error_handling
from app.models.strategy import Strategy
from app.utils.logging_config import backtest_logger

router = APIRouter()

class BacktestRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    strategy: Strategy

    @validator('start_date', 'end_date')
    def validate_date(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError("Invalid date format. Use YYYY-MM-DD")
        return v

@router.post("/backtest")
async def backtest(request: BacktestRequest):
    backtest_logger.info(f"Received backtest request for symbol: {request.symbol}, "
                         f"start_date: {request.start_date}, end_date: {request.end_date}")
    backtest_logger.debug(f"Strategy: {request.strategy}")
    result, error = run_backtest_with_error_handling(
        request.symbol,
        request.start_date,
        request.end_date,
        request.strategy
    )
    if error:
        raise HTTPException(status_code=500, detail=error)

    backtest_logger.info("Backtest completed successfully")
    return result
    


#router = APIRouter()

#@router.post("/backtest")
#async def backtest(
#    symbol: str,
#    start_date: str,
##    end_date: str,
 #   strategy: Strategy,
 #   #current_user: User = Depends(get_current_user)
#):
#    try:
#        result = run_backtest_with_error_handling(symbol, start_date, end_date, strategy)
#        return result
#    except ValueError as e:
#        raise HTTPException(status_code=400, detail=str(e))
#    except Exception as e:
 #       raise HTTPException(status_code=500, detail="An error occurred while running the backtest")