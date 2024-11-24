# app.models.strategy.py
from typing     import List, Dict, Optional
from pydantic   import BaseModel, validator
from sqlalchemy import Column, Integer, String, ARRAY, JSON, Boolean, Float

from app.core.database  import Base

###################################################################################################
""" User pydantic Model """
###################################################################################################

"""
Data Validation and API Schema (Pydantic Model):
    Used to define request/response data for your API
    
    The Pydantic model is designed to ensure that data being sent to or from the API follows specific rules
    e.g., email must be valid, username must be a string.
    It ensures that incoming data is clean and safe before it is processed
    e.g., before it's passed to the SQLAlchemy model to save to the database.
"""

class RuleInput(BaseModel):
    leftIndicator: str
    leftParams: Dict[str, str]
    operator: str
    useRightIndicator: bool = True
    rightIndicator: str = ""
    rightParams: Dict[str, str] = {}
    rightValue: Optional[str] = None
    logicalOperator: str = "and"

class StrategyInput(BaseModel):
    name: str
    allocation: float
    positionType: str
    entryRules: List[RuleInput]
    exitRules: List[RuleInput]
    active: bool = True
    regime_filter: Optional[str] = None
    position_size_method: str = 'fixed'
    fixed_position_size: Optional[float] = None    
    volatility_target: Optional[float] = None       
    volatility_lookback: Optional[int] = 30      
    volatility_buffer: Optional[float] = None       
    max_leverage: float = 1.0

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
    
###################################################################################################
""" User SQLAlchemy Model """
###################################################################################################

"""
Database Operations (SQLAlchemy Model):
    Used for database operations (CRUD)

    The SQLAlchemy model is designed to represent how data is structured in the database.
    It includes database-specific attributes like primary keys (id), indexing, and column definitions.
"""

class Startegy(Base):
    __tablename__ = "strategy"
    
    id                      = Column(Integer, primary_key=True, index=True)
    email                   = Column(String, unique=True, index=True)
    name                    = Column(String)
    allocation              = Column(Integer)
    positionType            = Column(String)
    entryRules              = Column(JSON)
    exitRules               = Column(JSON)
    active                  = Column(Boolean)
    regime_filter           = Column(String)
    position_size_method    = Column(String)
    fixed_position_size     = Column(Float)
    volatility_target       = Column(Float)
    volatility_lookback     = Column(Integer)
    volatility_buffer       = Column(Float)
    max_leverage            = Column(Float)

