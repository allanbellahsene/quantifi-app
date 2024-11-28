# app.models.backtest.py
from typing         import List
from pydantic       import BaseModel
from sqlalchemy     import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func

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

class Metrics(BaseModel):
    total_performance: float
    sharpe_ratio: float
    max_drawdown: float

class BacktestResult_(BaseModel):
    name: str
    config: BacktestInput
    metric: Metrics

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
    name            = Column(String)
    config          = Column(JSON)
    metric          = Column(JSON)
    created_at      = Column(DateTime, server_default=func.now())  # Automatically sets current timestamp when the row is created
    last_updated    = Column(DateTime, onupdate=func.now())        # Automatically updates the timestamp whenever the row is updated

    def set_config(self, config: BacktestInput):
        """Set the config using a Pydantic model."""
        self.config = config.dict()

    def get_config(self) -> BacktestInput:
        """Get the config as a Pydantic model."""
        return BacktestInput(**self.config)
    
    def set_metric(self, metric: Metrics):
        """Set the metric using a Pydantic model."""
        self.metric = metric.dict()

    def get_metric(self) -> Metrics:
        """Get the metric as a Pydantic model."""
        return Metrics(**self.metric)

###################################################################################################
""" Help Functions """
###################################################################################################

def convert_backtest_result_to_input(backtest_result: BacktestResult) -> BacktestInput:
    # If there's no data, handle it as needed (e.g., return None)
    if not backtest_result:
        return None

    return BacktestInput(**backtest_result.config)
