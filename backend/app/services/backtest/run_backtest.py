#app.services.baktest.run_backtest.py

import pandas as pd
import numpy as np
from typing import List
from app.services.backtest.strategies import Strategy, add_indicators
#from strategies import Strategy, add_indicators


def run_backtest(df: pd.DataFrame, strategy: Strategy, fees: float, slippage: float) -> pd.DataFrame:
    """Run a backtest for a single strategy"""
    # Convert fees and slippage from percentages to decimals
    fees = fees / 100
    slippage = slippage / 100
    print(f"Starting backtest for strategy {strategy.name}...")

    # Add indicators to the DataFrame
    df = add_indicators(df, [strategy])
    print("Indicators added to DataFrame")

    # Generate signals and calculate returns for the strategy
    if strategy.active:
        print(f"Generating signals for strategy: {strategy.name}")
        df[f'{strategy.name}_signal'] = strategy.generate_signals(df)
        df[f'{strategy.name}_position_size'] = strategy.calculate_position_sizes(df)
        print('position_type:')
        print(strategy.position_type)
        df[f'{strategy.name}_position'] = df[f'{strategy.name}_signal'].shift() * df[f'{strategy.name}_position_size']
        print(df.loc[df[f'{strategy.name}_position'] != 0])

        # Calculate returns
        df[f'{strategy.name}_returns'] = df[f'{strategy.name}_position'].shift() * df['Close'].pct_change() - \
                                         df[f'{strategy.name}_position'].diff().abs() * (fees + slippage)
        df[f'{strategy.name}_log_returns'] = df[f'{strategy.name}_position'].shift() * np.log(df['Close'] / df['Close'].shift()) - \
                                             df[f'{strategy.name}_position'].diff().abs() * (fees + slippage)

        # Calculate cumulative returns
        df[f'{strategy.name}_cumulative_equity'] = (1 + df[f'{strategy.name}_returns']).cumprod()
        df[f'{strategy.name}_cumulative_returns'] = df[f'{strategy.name}_cumulative_equity'] - 1
        df[f'{strategy.name}_cumulative_log_equity'] = df[f'{strategy.name}_log_returns'].cumsum()

        # Calculate drawdown
        df[f'{strategy.name}_drawdown'] = 1 - df[f'{strategy.name}_cumulative_equity'] / df[f'{strategy.name}_cumulative_equity'].cummax()

        # Calculate rolling Sharpe ratio
        window = 90  # rolling window size in days
        df[f'{strategy.name}_rolling_sharpe'] = df[f'{strategy.name}_returns'].rolling(window).apply(
            lambda x: (x.mean() / x.std()) * np.sqrt(365) if x.std() != 0 else 0)
    else:
        print(f"Strategy {strategy.name} is not active.")

    # Calculate market returns and metrics
    df['returns'] = df['Close'].pct_change()
    df['log_returns'] = np.log(df['Close'] / df['Close'].shift())
    df['cumulative_market_equity'] = (1 + df['returns']).cumprod()
    df['cumulative_market_returns'] = df['cumulative_market_equity'] - 1
    df['cumulative_log_market_equity'] = df['log_returns'].cumsum()
    df['market_drawdown'] = 1 - df['cumulative_market_equity'] / df['cumulative_market_equity'].cummax()
    df['market_rolling_sharpe'] = df['returns'].rolling(window).apply(
        lambda x: (x.mean() / x.std()) * np.sqrt(365) if x.std() != 0 else 0)

    print(f"Backtest for strategy {strategy.name} completed.")
    # Optionally save to CSV for debugging
    # df.to_csv(f'backtest_{strategy.name}.csv')

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


