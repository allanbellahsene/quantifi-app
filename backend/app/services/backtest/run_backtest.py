#app.services.baktest.run_backtest.py

import pandas as pd
import numpy as np
from typing import List, Optional
from app.services.strategy_module.strategy import Strategy
from app.services.strategy_module.utils import add_indicators
from app.services.backtest.metrics import rolling_sharpe_ratio
import time


def run_backtest(df: pd.DataFrame, strategy: Strategy, fees: float, slippage: float, regime_df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
    """Run a backtest for a single strategy"""
    # Convert fees and slippage from percentages to decimals
    fees = fees / 100
    slippage = slippage / 100
    print(f"Starting backtest for strategy {strategy.name}...")

    # Start timing the total backtest
    total_start_time = time.time()

    # Add indicators to both main and regime DataFrames
    indicators_start_time = time.time()
    df = add_indicators(df, [strategy])
    if regime_df is not None:
        regime_df = add_indicators(regime_df, [strategy])
    print("Indicators added to DataFrame")
    indicators_end_time = time.time()
    print(f"Indicators added to DataFrame (Time taken: {indicators_end_time - indicators_start_time:.4f} seconds)")

    strategy_calc_start = time.time()

    # Generate signals and calculate returns for the strategy
    print(f"Generating signals for strategy: {strategy.name}")
    signals_start_time = time.time()
    df[f'{strategy.name}_signal'] = strategy.generate_signals(df, regime_df)
    signals_end_time = time.time()
    print(f"Signals generated (Time taken: {signals_end_time - signals_start_time:.4f} seconds)")
    # Calculate position sizes
    position_sizes_start_time = time.time()
    df[f'{strategy.name}_position_size'] = strategy.calculate_position_sizes(df)
    position_sizes_end_time = time.time()
    print(f"Position sizes calculated (Time taken: {position_sizes_end_time - position_sizes_start_time:.4f} seconds)")

    # Calculate positions
    positions_start_time = time.time()
    df[f'{strategy.name}_position'] = df[f'{strategy.name}_signal'].shift() * df[f'{strategy.name}_position_size']
    positions_end_time = time.time()
    print(f"Positions calculated (Time taken: {positions_end_time - positions_start_time:.4f} seconds)")

    # Percentage change of Close prices
    close_pct_change = df['Close'].pct_change() #need to reshape otherwise using this in a column calculation wont work
    log_returns = np.log(df['Close'] / df['Close'].shift())

 
    # Calculate returns
    df[f'{strategy.name}_returns'] = df[f'{strategy.name}_position'].shift() * close_pct_change - df[f'{strategy.name}_position'].diff().abs() * (fees + slippage)
    df[f'{strategy.name}_log_returns'] = df[f'{strategy.name}_position'].shift() * log_returns - \
                                            df[f'{strategy.name}_position'].diff().abs() * (fees + slippage)

    # Calculate cumulative returns
    df[f'{strategy.name}_cumulative_equity'] = (1 + df[f'{strategy.name}_returns']).cumprod()
    df[f'{strategy.name}_cumulative_returns'] = df[f'{strategy.name}_cumulative_equity'] - 1
    df[f'{strategy.name}_cumulative_log_equity'] = df[f'{strategy.name}_log_returns'].cumsum()

    # Calculate drawdown
    df[f'{strategy.name}_drawdown'] = 1 - df[f'{strategy.name}_cumulative_equity'] / df[f'{strategy.name}_cumulative_equity'].cummax()

    # Calculate rolling Sharpe ratio
    window = 90  # rolling window size in days
    df[f'{strategy.name}_rolling_sharpe'] = rolling_sharpe_ratio(df[f'{strategy.name}_returns'], window)
    
    strategy_calc_end = time.time()
    print(f"Strategy signals, positions and metrics calculations {strategy.name} completed in {strategy_calc_end - strategy_calc_start:.4f} seconds.")

    # Calculate market returns and metrics
    df['returns'] = close_pct_change
    df['log_returns'] = log_returns
    df['cumulative_market_equity'] = (1 + df['returns']).cumprod()
    df['cumulative_market_returns'] = df['cumulative_market_equity'] - 1
    df['cumulative_log_market_equity'] = df['log_returns'].cumsum()
    df['market_drawdown'] = 1 - df['cumulative_market_equity'] / df['cumulative_market_equity'].cummax()
    df['market_rolling_sharpe'] = rolling_sharpe_ratio(df['returns'], window)

    print(f"Backtest for strategy {strategy.name} completed.")
    # Optionally save to CSV for debugging
    # df.to_csv(f'backtest_{strategy.name}.csv')
    # End timing the total backtest
    total_end_time = time.time()
    print(f"Backtest for strategy {strategy.name} completed in {total_end_time - total_start_time:.4f} seconds.")

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
    bt = run_backtest(df, strategy_vol_target, fees=0.0001, slippage=0.0005)
    bt.to_csv('backtest_test.csv')


