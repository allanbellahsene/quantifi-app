#backend/app/models/backtest_request.py
from pydantic import BaseModel
from typing import List
from app.models.strategy import Strategy

class BacktestRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    strategy: Strategy