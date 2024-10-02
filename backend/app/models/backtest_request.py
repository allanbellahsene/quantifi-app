#backend/app/models/backtest_request.py
from pydantic import BaseModel, validator
from typing import List
from app.models.strategy import Strategy
from datetime import datetime


class BacktestRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    strategy: Strategy

    @validator('symbol')
    def validate_symbol(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError('Symbol must be a non-empty string')
        return v

    @validator('start_date', 'end_date')
    def validate_dates(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError('Invalid date format. Use YYYY-MM-DD')
        return v