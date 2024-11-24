# app/services/portfolio/metrics_calculator.py
import pandas as pd
import numpy as np
from typing import List
from app.services.backtest.metrics import rolling_sharpe_ratio
import logging

logger = logging.getLogger(__name__)

class PortfolioMetricsCalculator:
    def __init__(self, df: pd.DataFrame, strategies_info: List):
        self.df = df
        self.strategies_info = strategies_info
        self.window = 90  # Rolling window for metrics

    def calculate_all_metrics(self) -> pd.DataFrame:
        """
        Calculates all portfolio metrics.
        """
        try:
            self._calculate_basic_metrics()
            self._calculate_equity_curves()
            self._calculate_drawdowns()
            self._calculate_rolling_metrics()
            return self.df
        except Exception as e:
            logger.error(f"Error calculating portfolio metrics: {str(e)}")
            raise

    def _calculate_basic_metrics(self):
        """Calculates basic return metrics."""
        self.df['returns'] = self.df['Close'].pct_change()
        self.df['log_returns'] = np.log(self.df['Close'] / self.df['Close'].shift())

    def _calculate_equity_curves(self):
        """Calculates equity curves for portfolio and market."""
        self.df['cumulative_equity'] = (1 + self.df['portfolio_returns']).cumprod()
        self.df['cumulative_log_equity'] = self.df['portfolio_log_returns'].cumsum()
        self.df['cumulative_market_equity'] = (1 + self.df['returns']).cumprod()
        self.df['cumulative_log_market_equity'] = self.df['log_returns'].cumsum()
        self.df['cumulative_market_returns'] = self.df['cumulative_market_equity'] - 1

    def _calculate_drawdowns(self):
        """Calculates drawdowns for portfolio and market."""
        self.df['portfolio_drawdown'] = 1 - self.df['cumulative_equity'] / \
                                          self.df['cumulative_equity'].cummax()
        self.df['market_drawdown'] = 1 - self.df['cumulative_market_equity'] / \
                                        self.df['cumulative_market_equity'].cummax()

    def _calculate_rolling_metrics(self):
        """Calculates rolling metrics including Sharpe ratio."""
        self.df['portfolio_rolling_sharpe'] = rolling_sharpe_ratio(
            self.df['portfolio_returns'], 
            self.window
        )
        self.df['market_rolling_sharpe'] = rolling_sharpe_ratio(
            self.df['returns'], 
            self.window
        )