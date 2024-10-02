#backend/services/backtest_service.py

import pandas as pd
import numpy as np
from app.models.strategy import Strategy, Rule
from app.utils.data_fetcher import fetch_binance_data, fetch_btc_data
import traceback
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def create_indicator(df: pd.DataFrame, indicator: str, window: int = None) -> pd.Series:
    if indicator == 'Close':
        return df['Close']
    elif indicator == 'Open':
        return df['Open']
    elif indicator == 'High':
        return df['High']
    elif indicator == 'Low':
        return df['Low']
    elif indicator == 'Volume':
        return df['Volume']
    elif indicator == 'BTC':
        return df['BTC']
    elif indicator == 'BTC_MA':
        return df['BTC_MA']
    elif indicator == 'Coin_MA':
        return df['Close'].rolling(window=50).mean()  # Default to 50-day MA
    elif indicator.startswith('SMA'):
        return df['Close'].rolling(window=window).mean()
    elif indicator.startswith('EMA'):
        return df['Close'].ewm(span=window, adjust=False).mean()
    elif indicator == 'Rolling High':
        return df['High'].rolling(window=window).max().shift()
    elif indicator == 'Rolling Low':
        return df['Low'].rolling(window=window).min().shift()
    else:
        raise ValueError(f"Unknown indicator: {indicator}")

def create_condition(df: pd.DataFrame, rule: Rule) -> pd.Series:
    left = create_indicator(df, rule.left_indicator, rule.left_window)
    right = create_indicator(df, rule.right_indicator, rule.right_window)
    
    if rule.comparison == '>':
        return left > right
    elif rule.comparison == '<':
        return left < right
    elif rule.comparison == '==':
        return left == right
    elif rule.comparison == '>=':
        return left >= right
    elif rule.comparison == '<=':
        return left <= right
    else:
        raise ValueError(f"Unknown comparison: {rule.comparison}")

def apply_strategy(df: pd.DataFrame, strategy: Strategy) -> pd.DataFrame:
    signals = pd.Series(0, index=df.index)
    for rule in strategy.rules:
        condition_met = create_condition(df, rule)
        signals[condition_met] = 1 if rule.action == 'Buy' else 0
    return signals

def run_backtest(symbol: str, start_date: str, end_date: str, strategy: Strategy):
    # Fetch data for the selected symbol
    df = fetch_binance_data(symbol, start_date, end_date)
    
    # Fetch BTC data for regime filter
    btc_df = fetch_btc_data(start_date, end_date)
    
    # Add BTC data to main DataFrame
    df['BTC'] = btc_df['Close']
    df['BTC_MA'] = btc_df['Close'].rolling(window=100).mean()  # 100-day MA for BTC
    
    # Apply strategy
    df['Signal'] = apply_strategy(df, strategy)
    
    # Apply regime filter
    df['Regime'] = np.where(df['BTC'] > df['BTC_MA'], 1, 0)
    df['Final_Signal'] = df['Signal'] * df['Regime']
    
    # Calculate returns
    df['Returns'] = df['Close'].pct_change()
    df['Strategy_Returns'] = df['Final_Signal'].shift(1) * df['Returns']
    df['Cumulative_Returns'] = (1 + df['Strategy_Returns']).cumprod()
    
    # Calculate metrics
    total_return = df['Cumulative_Returns'].iloc[-1] - 1
    sharpe_ratio = np.sqrt(252) * df['Strategy_Returns'].mean() / df['Strategy_Returns'].std()
    max_drawdown = (df['Cumulative_Returns'] / df['Cumulative_Returns'].cummax() - 1).min()
    
    return {
        "metrics": {
            "total_return": total_return,
            "sharpe_ratio": sharpe_ratio,
            "max_drawdown": max_drawdown
        },
        "equity_curve": df['Cumulative_Returns'].tolist(),
        "dates": df.index.strftime('%Y-%m-%d').tolist()
    }

def run_backtest_with_error_handling(symbol: str, start_date: str, end_date: str, strategy: Strategy):
    try:
        result = run_backtest(symbol, start_date, end_date, strategy)
        return result, None
    except Exception as e:
        error_msg = f"Backtest failed: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        logger.error(error_msg)
        return None, error_msg

