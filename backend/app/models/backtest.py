from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Any, Literal

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