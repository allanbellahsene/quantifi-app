#app.services.baktest.run_backtest.py

import pandas as pd
import numpy as np
from typing import List
from app.services.backtest.strategies import Strategy, add_indicators
#from strategies import Strategy, add_indicators


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
            df[f'{strategy.name}_position_size'] = strategy.calculate_position_sizes(df)
            df[f'{strategy.name}_position'] = df[f'{strategy.name}_signal'].shift() * df[f'{strategy.name}_position_size'] * strategy.position_type
            df[f'{strategy.name}_returns'] = df[f'{strategy.name}_position'].shift() * df['Close'].pct_change() - \
                                             df[f'{strategy.name}_position'].diff().abs() * (fees + slippage)
            df[f'{strategy.name}_cumulative_equity'] = (1 + df[f'{strategy.name}_returns']).cumprod()
            df[f'{strategy.name}_cumulative_returns'] = df[f'{strategy.name}_cumulative_equity'] - 1

    # Combine signals from all active strategies
    df['total_position'] = sum(
        df[f'{strategy.name}_position'] * strategy.active
        for strategy in strategies
    )
    print("Combined signals from all active strategies")

    # Calculate overall portfolio returns
    df['returns'] = df['Close'].pct_change()
    df['gross_portfolio_returns'] = df['total_position'].shift() * df['returns']

    # Apply fees and slippage
    df['trades'] = df['total_position'].diff().abs()
    df['transaction_costs'] = df['trades'] * (fees + slippage)
    df['portfolio_returns'] = df['gross_portfolio_returns'] - df['transaction_costs']
    print("Calculated returns and applied fees and slippage")

    # Calculate cumulative returns
    df['cumulative_equity'] = (1 + df['portfolio_returns']).cumprod()
    df['cumulative_market_equity'] = (1 + df['returns']).cumprod()
    df['cumulative_returns'] = df['cumulative_equity'] - 1
    df['cumulative_market_returns'] = df['cumulative_market_equity'] - 1
    print("Calculated cumulative returns")

    # Calculate drawdowns
    df['portfolio_drawdown'] = 1 - df['cumulative_equity'] / df['cumulative_equity'].cummax()
    df['market_drawdown'] = 1 - df['cumulative_market_equity'] / df['cumulative_market_equity'].cummax()
    # Calculate drawdowns for each individual strategy
    for strategy in strategies:
        if strategy.active:
            df[f'{strategy.name}_drawdown'] = 1 - df[f'{strategy.name}_cumulative_equity'] / df[f'{strategy.name}_cumulative_equity'].cummax()
    print("Calculated individual strategy drawdowns")
    print("Calculated drawdowns")
    # Calculate rolling Sharpe ratios
    window = 90  # rolling window size in days
    df['portfolio_rolling_sharpe'] = df['portfolio_returns'].rolling(window).apply(lambda x: (x.mean() / x.std()) * np.sqrt(365) if x.std() != 0 else 0)
    df['market_rolling_sharpe'] = df['returns'].rolling(window).apply(lambda x: (x.mean() / x.std()) * np.sqrt(365) if x.std() != 0 else 0)
    for strategy in strategies:
        if strategy.active:
            df[f'{strategy.name}_rolling_sharpe'] = df[f'{strategy.name}_returns'].rolling(window).apply(
                lambda x: (x.mean() / x.std()) * np.sqrt(365) if x.std() != 0 else 0)
    print("Calculated rolling Sharpe ratios")

    print("Backtest completed")

    return df


if __name__ == "__main__":
    import yfinance as yf
    df = yf.download('BTC-USD', start='2020-01-01', end='2024-01-01')
    strategy_vol_target = Strategy(
        name='vol_target',
        entry_rules='SMA(20) > SMA(100)',
        exit_rules='SMA(20) < SMA(100)',
        position_type='long',
        position_size_method='volatility_target',
        volatility_target=0.5,
        volatility_lookback=30
    )    
    strategy_fixed = Strategy(
        name='fixed',
        entry_rules='SMA(20) > SMA(100)',
        exit_rules='SMA(20) < SMA(100)',
        position_type='long',
        position_size_method='fixed'
    )
    bt = run_backtest(df, [strategy_vol_target, strategy_fixed], fees=0.0001, slippage=0.0005)
    bt.to_csv('backtest_test.csv')


