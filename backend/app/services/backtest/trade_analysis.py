#trade_analysis.py

import pandas as pd
import numpy as np
from typing import List, Any

def process_trade(trade_df):
    entry_date = trade_df['Date'].iloc[0]
    exit_date = trade_df['Date'].iloc[-1]
    delta_pos = trade_df['delta_position']
    Close = trade_df['Close']
    initial_position = trade_df['position'].iloc[0]

    if initial_position > 0:
        # Long trade
        trade_type = 'Long'
        # Entry when delta_pos > 0
        delta_pos_entry = delta_pos[delta_pos > 0]
        Close_entry = Close[delta_pos > 0]
        total_pos_entry = delta_pos_entry.sum()

        # Exit when delta_pos < 0
        delta_pos_exit = delta_pos[delta_pos < 0]
        Close_exit = Close[delta_pos < 0]
        total_pos_exit = delta_pos_exit.sum()  # Negative of negative values

        # Trade return: (avg_exit_price - avg_entry_price) / avg_entry_price
        calc_trade_return = lambda avg_entry_price, avg_exit_price: (avg_exit_price - avg_entry_price) / avg_entry_price

    elif initial_position < 0:
        # Short trade
        # Entry when delta_pos < 0 (position decreases, more negative)
        delta_pos_entry = -delta_pos[delta_pos < 0]  # Convert to positive quantities
        Close_entry = Close[delta_pos < 0]
        total_pos_entry = delta_pos_entry.sum()

        # Exit when delta_pos > 0 (position increases towards zero)
        delta_pos_exit = delta_pos[delta_pos > 0]
        Close_exit = Close[delta_pos > 0]
        total_pos_exit = delta_pos_exit.sum()

        # Trade return: (avg_entry_price - avg_exit_price) / avg_entry_price
        calc_trade_return = lambda avg_entry_price, avg_exit_price: (avg_entry_price - avg_exit_price) / avg_entry_price

    else:
        # Should not occur, but handle just in case
        trade_type = 'Flat'
        total_pos_entry = 0
        total_pos_exit = 0
        avg_entry_price = np.nan
        avg_exit_price = np.nan
        trade_return = np.nan
        return pd.Series({
            'Entry Date': entry_date,
            'Exit Date': exit_date,
            'Average Entry Price': avg_entry_price,
            'Average Exit Price': avg_exit_price,
            'Trade Return': trade_return,
            'Trade Type': trade_type
        })

    # Calculate average entry price
    if total_pos_entry != 0:
        avg_entry_price = (delta_pos_entry * Close_entry).sum() / total_pos_entry
    else:
        avg_entry_price = np.nan

    # Calculate average exit price
    if total_pos_exit != 0:
        avg_exit_price = (delta_pos_exit * Close_exit).sum() / total_pos_exit
    else:
        avg_exit_price = np.nan

    # Calculate trade return
    if not np.isnan(avg_entry_price) and not np.isnan(avg_exit_price):
        trade_return = calc_trade_return(avg_entry_price, avg_exit_price)
    else:
        trade_return = np.nan

    return pd.Series({
        'Entry Date': entry_date,
        'Exit Date': exit_date,
        'Average Entry Price': avg_entry_price,
        'Average Exit Price': avg_exit_price,
        'Position': -total_pos_exit,
        'Trade Return': trade_return,
        'Trade Type': trade_type
    })
    

def trade_analysis(data, strategy):
    df = data.copy()
    df = df[['Close', f'{strategy.name}_position']].dropna()
    df['Date'] = pd.to_datetime(df.index)
    df['position'] = df[f'{strategy.name}_position']

    # Step 1: Compute position and delta_position
    df['delta_position'] = df['position'].diff().fillna(0)

    # Step 2: Identify entries and exits, and assign trade_ids
    df['entry_mask'] = ((df['position'].shift(1).fillna(0) == 0) & (df['position'] != 0)).astype(int)
    df['trade_id'] = df['entry_mask'].cumsum()

    # Fix: Only set trade_id to NaN when position is zero and there's no position change
    df.loc[(df['position'] == 0) & (df['delta_position'] == 0), 'trade_id'] = np.nan

    # Step 4: Apply the function to each trade
    df_valid_trades = df[df['trade_id'].notnull()]
    trades = df_valid_trades.groupby('trade_id').apply(process_trade).reset_index(drop=True)
    trades['strategy'] = strategy.name

    return trades


def analyze_all_trades(strategies_df_results: List[pd.DataFrame], strategies_info: List[Any]) -> pd.DataFrame:
    TRADES_DF = []
    for idx, df in enumerate(strategies_df_results):
        strategy = strategies_info[idx]
        trades = trade_analysis(df, strategy)
        TRADES_DF.append(trades)

    trades_df = pd.concat(TRADES_DF, axis=0)
    trades_df['Entry Date'] = pd.to_datetime(trades_df['Entry Date'])
    trades_df.sort_values(by='Entry Date', inplace=True, ascending=False)

    trades_df = trades_df.rename(columns={
        "Average Entry Price": "avg_entry_price",
        "Average Exit Price": "avg_exit_price",
        "Entry Date": "entry_date",
        "Exit Date": "exit_date",
        "Position": "position",
        "Trade Return": "trade_return",
        "Trade Type": "trade_type"
    })

    return trades_df
