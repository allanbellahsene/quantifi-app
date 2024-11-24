# app.models.backtest.py
import json

from typing     import List, Dict, Optional, Any, Literal
from pydantic   import BaseModel, Field, validator
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
    e.g., email must be valid, username must be a string.
    It ensures that incoming data is clean and safe before it is processed
    e.g., before it's passed to the SQLAlchemy model to save to the database.
"""

class IndicatorInput(BaseModel):
    type: str  # 'simple' or 'composite'
    name: Optional[str] = None
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    expression: Optional[str] = None

    @validator('params')
    def validate_params(cls, v):
        return v or {}

class RuleInput(BaseModel):
    leftIndicator: IndicatorInput
    operator: str
    useRightIndicator: bool = True
    rightIndicator: Optional[IndicatorInput] = None
    rightValue: Optional[str] = None
    logicalOperator: str = "and"

    @validator('rightIndicator', 'rightValue')
    def validate_right_side(cls, v, values):
        if 'useRightIndicator' in values:
            if values['useRightIndicator'] and not v and isinstance(v, type(None)):
                raise ValueError("Right indicator must be provided when useRightIndicator is True")
            elif not values['useRightIndicator'] and isinstance(v, IndicatorInput):
                return None
        return v

class StrategyInput(BaseModel):
    name: str
    allocation: float
    positionType: str
    entryRules: List[RuleInput]
    exitRules: List[RuleInput]
    entryRegimeRules: Optional[List[RuleInput]] = None
    exitRegimeRules: Optional[List[RuleInput]] = None
    regimeEntryAction: Optional[Literal['long', 'short']] = None
    regimeExitAction: Optional[Literal['long', 'short']] = None
    regimeAsset: Optional[str] = None
    active: bool = True
    position_size_method: str = 'fixed'
    fixed_position_size: Optional[float] = None    
    volatility_target: Optional[float] = None       
    volatility_lookback: Optional[int] = 30      
    volatility_buffer: Optional[float] = None       
    max_leverage: float = 1.0
    frequency: str

    @validator('regimeEntryAction')
    def validate_entry_regime(cls, v, values):
        if bool(values.get('entryRegimeRules')) != bool(v):
            raise ValueError('Both entryRegimeRules and regimeEntryAction must be provided together')
        return v

    @validator('regimeExitAction')
    def validate_exit_regime(cls, v, values):
        if bool(values.get('exitRegimeRules')) != bool(v):
            raise ValueError('Both exitRegimeRules and regimeExitAction must be provided together')
        return v

    @validator('fixed_position_size', always=True)
    def validate_fixed_position_size(cls, v, values):
        if values.get('position_size_method') == 'fixed' and v is None:
            raise ValueError('fixed_position_size must be provided when position_size_method is "fixed"')
        return v

    @validator('volatility_target', always=True)
    def validate_volatility_target(cls, v, values):
        if values.get('position_size_method') == 'volatility_target' and v is None:
            raise ValueError('volatility_target must be provided when position_size_method is "volatility_target"')
        return v

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
    strategies: List[StrategyInput] = [StrategyInput(**s) for s in json.loads(backtest_result.strategies)]

    # Create an instance of BacktestInput using data from BacktestResult
    backtest_input = BacktestInput(
        symbol=backtest_result.symbol,
        start=backtest_result.start,
        end=backtest_result.end,
        fees=backtest_result.fees,
        slippage=backtest_result.slippage,
        strategies=strategies
    )

    return backtest_input
