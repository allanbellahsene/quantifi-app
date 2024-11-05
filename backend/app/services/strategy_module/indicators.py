# indicators.py

import pandas as pd
from typing import Callable, Dict

# Indicator Functions
def SMA(series: pd.Series, window: int) -> pd.Series:
    """Calculate Simple Moving Average."""
    return series.rolling(window=window).mean().shift()

def EMA(series: pd.Series, window: int) -> pd.Series:
    """Calculate Exponential Moving Average."""
    return series.ewm(span=window, adjust=False).mean().shift()

def rolling_high(series: pd.Series, window: int) -> pd.Series:
    """Calculate Rolling High."""
    return series.rolling(window=window).max().shift()

def rolling_low(series: pd.Series, window: int) -> pd.Series:
    """Calculate Rolling Low."""
    return series.rolling(window=window).min().shift()

def MA_trend(series: pd.Series, ma_window: int, return_window: int) -> pd.Series:
    """Calculate the trend of a moving average."""
    ma = series.rolling(window=ma_window).mean()
    return ma.pct_change(periods=return_window)

def VWAP(df: pd.DataFrame) -> pd.Series:
    """Calculate Volume Weighted Average Price (VWAP)."""
    # Check that data is intraday
    inferred_freq = pd.infer_freq(df.index)
    if inferred_freq == 'D':
        raise ValueError("VWAP can only be calculated on intraday data")
    avg_price = (df['High'] + df['Low'] + df['Close']) / 3
    cum_vol_price = (avg_price * df['Volume']).groupby(df.index.date).cumsum()
    cum_volume = df['Volume'].groupby(df.index.date).cumsum()
    vwap = cum_vol_price / cum_volume
    return vwap.shift()

# Dictionary of available indicators
INDICATORS: Dict[str, Callable] = {
    'SMA': SMA,
    'EMA': EMA,
    'Rolling_High': rolling_high,
    'Rolling_Low': rolling_low,
    'MA_trend': MA_trend,
    'VWAP': VWAP,
}

