# app.models.backtest.py
import json

from typing     import List
from pydantic   import BaseModel
from sqlalchemy import Column, Integer, String, JSON

from app.core.database      import Base
from app.models.strategy    import StrategyInput


###################################################################################################
""" Backtest pydantic Model """
###################################################################################################

"""
Data Validation and API Schema (Pydantic Model):
    Used to define request/response data for your API
    
    The Pydantic model is designed to ensure that data being sent to or from the API follows specific rules
"""

class BacktestInput(BaseModel):
    symbol: str
    data_source: str
    start: str
    end: str
    fees: float
    slippage: float
    strategies: List[StrategyInput]

class BacktestResult_(BaseModel):
    symbol: str
    data_source: str
    start: str
    end: str
    fees: float
    slippage: float
    strategies: List[StrategyInput]
    sharpe_ratio: float
    max_drawdown: float
    cagr: float

###################################################################################################
""" Backtest SQLAlchemy Model """
###################################################################################################

"""
Database Operations (SQLAlchemy Model):
    Used for database operations (CRUD)

    The SQLAlchemy model is designed to represent how data is structured in the database.
    It includes database-specific attributes like primary keys (id), indexing, and column definitions.
"""

class BacktestResult(Base):
    __tablename__ = "backtest"
    
    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, index=True)
    symbol          = Column(String, index=True)
    data_source     = Column(String)
    start           = Column(String)
    end             = Column(String)
    fees            = Column(Integer)
    slippage        = Column(Integer)
    strategies      = Column(JSON)
    sharpe_ratio    = Column(Integer)
    max_drawdown    = Column(Integer)
    cagr            = Column(Integer)

###################################################################################################
""" Help Functions """
###################################################################################################

def convert_backtest_result_to_input(backtest_result: BacktestResult) -> BacktestInput:
    # If there's no data, handle it as needed (e.g., return None)
    if not backtest_result:
        return None

    # Convert the 'strategies' JSON field to a list of StrategyInput objects
    print(json.loads(backtest_result.strategies))
    strategies: List[StrategyInput] = [StrategyInput(**s) for s in json.loads(backtest_result.strategies)]

    # Create an instance of BacktestInput using data from BacktestResult
    backtest_input = BacktestInput(
        symbol=backtest_result.symbol,
        data_source=backtest_result.data_source,
        start=backtest_result.start,
        end=backtest_result.end,
        fees=backtest_result.fees,
        slippage=backtest_result.slippage,
        strategies=strategies
    )

    return backtest_input
