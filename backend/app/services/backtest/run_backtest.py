#app.services.baktest.run_backtest.py

import pandas as pd
import numpy as np
from typing import List
from app.services.backtest.strategies import Strategy, add_indicators


def run_backtest(df: pd.DataFrame, strategies: List[Strategy], fees: float, slippage: float) -> pd.DataFrame:
    """Run a backtest for the given strategies"""
    print("Starting backtest...")

    # Add indicators to the DataFrame
    df = add_indicators(df, strategies)
    print("Indicators added to DataFrame")

    # Generate signals and calculate returns for each strategy
    for strategy in strategies:
        if strategy.active:
            print(f"Generating signals for strategy: {strategy.name}")
            df[f'{strategy.name}_signal'] = strategy.generate_signals(df)
            df[f'{strategy.name}_returns'] = df[f'{strategy.name}_signal'].shift() * df['Close'].pct_change() - \
                                             df[f'{strategy.name}_signal'].diff().abs() * (fees + slippage)
            df[f'{strategy.name}_cumulative_equity'] = (1 + df[f'{strategy.name}_returns']).cumprod()
            df[f'{strategy.name}_cumulative_returns'] = df[f'{strategy.name}_cumulative_equity'] - 1

    # Combine signals from all active strategies
    df['position'] = sum(
        df[f'{strategy.name}_signal'] * strategy.position_size * strategy.active
        for strategy in strategies
    )
    print("Combined signals from all active strategies")

    # Calculate overall portfolio returns
    df['returns'] = df['Close'].pct_change()
    df['gross_strategy_returns'] = df['position'].shift() * df['returns']

    # Apply fees and slippage
    df['trades'] = df['position'].diff().abs()
    df['transaction_costs'] = df['trades'] * (fees + slippage)
    df['strategy_returns'] = df['gross_strategy_returns'] - df['transaction_costs']
    print("Calculated returns and applied fees and slippage")

    # Calculate cumulative returns
    df['cumulative_equity'] = (1 + df['strategy_returns']).cumprod()
    df['cumulative_market_equity'] = (1 + df['returns']).cumprod()
    df['cumulative_returns'] = df['cumulative_equity'] - 1
    df['cumulative_market_returns'] = df['cumulative_market_equity'] - 1
    print("Calculated cumulative returns")

    # Calculate drawdowns
    df['strategy_drawdown'] = 1 - df['cumulative_equity'] / df['cumulative_equity'].cummax()
    df['market_drawdown'] = 1 - df['cumulative_market_equity'] / df['cumulative_market_equity'].cummax()
    # Calculate drawdowns for each individual strategy
    for strategy in strategies:
        if strategy.active:
            df[f'{strategy.name}_drawdown'] = 1 - df[f'{strategy.name}_cumulative_equity'] / df[f'{strategy.name}_cumulative_equity'].cummax()
    print("Calculated individual strategy drawdowns")
    print("Calculated drawdowns")
    # Calculate rolling Sharpe ratios
    window = 90  # rolling window size in days
    df['strategy_rolling_sharpe'] = df['strategy_returns'].rolling(window).apply(lambda x: (x.mean() / x.std()) * np.sqrt(252) if x.std() != 0 else 0)
    df['market_rolling_sharpe'] = df['returns'].rolling(window).apply(lambda x: (x.mean() / x.std()) * np.sqrt(252) if x.std() != 0 else 0)
    for strategy in strategies:
        if strategy.active:
            df[f'{strategy.name}_rolling_sharpe'] = df[f'{strategy.name}_returns'].rolling(window).apply(
                lambda x: (x.mean() / x.std()) * np.sqrt(365) if x.std() != 0 else 0)
    print("Calculated rolling Sharpe ratios")

    print("Backtest completed")

    return df

