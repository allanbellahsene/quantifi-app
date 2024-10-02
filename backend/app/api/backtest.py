#backend/app/api/backtest.py

from fastapi import APIRouter, HTTPException
from app.services.backtest_service import run_backtest_with_error_handling
from app.models.strategy import Strategy
from app.models.backtest_request import BacktestRequest
#from fastapi import Depends
#from app.models.user import User

#from app.api.auth import get_current_user

router = APIRouter()

@router.post("/backtest")
async def backtest(request: BacktestRequest):
    try:
        result, error = run_backtest_with_error_handling(request.symbol, 
                                                         request.start_date, 
                                                         request.end_date, 
                                                         request.strategy)
        if error:
            raise HTTPException(status_code=500, detail=error)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    


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