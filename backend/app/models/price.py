# app.models.price.py
from pydantic   import BaseModel
from sqlalchemy import Column, Integer, String, Float

from app.core.database      import Base

###################################################################################################
""" Price pydantic Model """
###################################################################################################

"""
Data Validation and API Schema (Pydantic Model):
    Used to define request/response data for your API
    
    The Pydantic model is designed to ensure that data being sent to or from the API follows specific rules
    e.g., date must be valid, symbol must be a string, etc...
    It ensures that incoming data is clean and safe before it is processed
    e.g., before it's passed to the SQLAlchemy model to save to the database.
"""

class PriceTimeSeries(BaseModel):
    symbol: str
    market: str
    time: float
    open: float
    high: float
    low: float
    close: float

###################################################################################################
""" Price SQLAlchemy Model """
###################################################################################################

"""
Database Operations (SQLAlchemy Model):
    Used for database operations (CRUD)

    The SQLAlchemy model is designed to represent how data is structured in the database.
    It includes database-specific attributes like primary keys (id), indexing, and column definitions.
"""

class Price(Base):
    __tablename__ = "price"
    
    id      = Column(Integer, primary_key=True, index=True)
    symbol  = Column(String, index=True)
    market  = Column(String, index=True)
    time    = Column(Float, index=True)
    open    = Column(Float)
    high    = Column(Float)
    low     = Column(Float)
    close   = Column(Float)



