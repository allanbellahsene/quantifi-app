# models/saved_backtest.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .backtest import BacktestInput

class BacktestMetrics(BaseModel):
    total_performance: float
    sharpe_ratio: float
    max_drawdown: float

class SavedBacktest(BaseModel):
    user_id: Optional[str] = None  # Make it optional
    backtest_name: str
    backtest_config: BacktestInput
    metrics: BacktestMetrics
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    last_updated: str = Field(default_factory=lambda: datetime.now().isoformat())