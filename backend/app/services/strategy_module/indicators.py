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


def average_move_from_open(intraday_df: pd.DataFrame, 
                             daily_df: pd.DataFrame,
                             rolling_window: int) -> pd.DataFrame:
    """
    Creates a matrix with times as rows and dates as columns, with values normalized by daily open.
    
    Args:
        intraday_df: DataFrame with minute-level data (columns: volume, open, high, low, close, caldt)
        daily_df: DataFrame with daily data (columns: volume, open, high, low, close, caldt)
        
    Returns:
        DataFrame with times as index and last 14 calendar dates as columns, values normalized by daily open
    """
    # Convert caldt to datetime for both dataframes
    intraday_df = intraday_df.copy()
    daily_df = daily_df.copy()
    
    intraday_df['datetime'] = pd.to_datetime(intraday_df.index, utc=True)
    daily_df['datetime'] = pd.to_datetime(daily_df.index, utc=True)

    intraday_df['datetime'] = intraday_df['datetime'].dt.tz_convert('America/New_York')
    daily_df['datetime'] = daily_df['datetime'].dt.tz_convert('America/New_York')
    
    # Extract date and time for intraday data
    intraday_df['date'] = intraday_df['datetime'].dt.date
    intraday_df['time'] = intraday_df['datetime'].dt.strftime('%H:%M')
    
    # Extract date for daily data
    daily_df['date'] = daily_df['datetime'].dt.date
    
    # Create a dictionary of daily opens for quick lookup
    daily_opens = daily_df.set_index('date')['Open'].to_dict()
    
    # Create the basic time-date matrix first
    pivot_df = intraday_df.pivot(
        index='time',
        columns='date',
        values='Close'
    )

    
    # Get the last X dates
    last_X_dates = sorted(intraday_df['date'].unique())[-rolling_window:]
    pivot_df = pivot_df[last_X_dates]

    
    # Normalize each column by its daily open
    for date in last_X_dates:
        if date in daily_opens:
            pivot_df[date] = abs(pivot_df[date] / daily_opens[date] - 1)
    
    # Sort index by time
    pivot_df.sort_index(inplace=True)
    
    # Round to 4 decimal places for readability
    pivot_df = pivot_df.round(4)

    avg_move_from_open = pd.DataFrame(pivot_df.mean(axis=1), columns=['avg_move_from_open'])
    
    return avg_move_from_open

# Add to INDICATORS dictionary
INDICATORS: Dict[str, Callable] = {
    'SMA': SMA,
    'EMA': EMA,
    'Rolling_High': rolling_high,
    'Rolling_Low': rolling_low,
    'MA_trend': MA_trend,
    'VWAP': VWAP,
    'Average_Move_From_Open': average_move_from_open,
}

