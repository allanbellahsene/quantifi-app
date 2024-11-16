# signals.py

import pandas as pd
import numpy as np
from app.services.strategy_module.expressions import CompositeRule
from typing import Optional

def generate_signals_old(df: pd.DataFrame, entry_signal: CompositeRule, exit_signal: CompositeRule, position_type: int = 1) -> pd.Series:
    """Generate trading signals based on entry and exit rules."""
    entry: np.ndarray = entry_signal.evaluate(df).flatten()
    exit: np.ndarray = exit_signal.evaluate(df).flatten()


    position: np.ndarray = np.zeros(len(df), dtype=int)
    in_position: np.ndarray = np.zeros(len(df), dtype=bool)

    position = np.where(entry, position_type, position)


    for i in range(1, len(df)):

        if position[i] == 0:  # If no new signal
            if in_position[i - 1] and not exit[i]:
                position[i] = position_type
            elif in_position[i - 1] and exit[i]:
                position[i] = 0
            else:
                position[i] = position[i - 1]

        in_position[i] = position[i] != 0

    return pd.Series(position, index=df.index)


def generate_signals(
    df: pd.DataFrame, 
    entry_signal: CompositeRule, 
    exit_signal: CompositeRule, 
    position_type: int = 1,
    entry_regime: Optional[CompositeRule] = None,
    exit_regime: Optional[CompositeRule] = None,
    regime_df: Optional[pd.DataFrame] = None,
    regime_entry_action: Optional[str] = None,
    regime_exit_action: Optional[str] = None
) -> pd.Series:
    """
    Generate trading signals based on entry and exit rules with regime filters.
    """
    # Base signals
    entry = entry_signal.evaluate(df)
    if isinstance(entry, np.ndarray):
        entry = pd.Series(entry, index=df.index)
    
    exit = exit_signal.evaluate(df)
    if isinstance(exit, np.ndarray):
        exit = pd.Series(exit, index=df.index)

    # Initialize arrays
    position = pd.Series(np.zeros(len(df)), index=df.index)
    in_position = pd.Series(np.zeros(len(df), dtype=bool), index=df.index)

    # Handle regime filters if provided
    if regime_df is not None:
        # Entry regime handling
        allow_entries = pd.Series(np.ones(len(df), dtype=bool), index=df.index)  # Default allow all entries
        if entry_regime and regime_entry_action:
            entry_regime_signal = entry_regime.evaluate(regime_df)
            if isinstance(entry_regime_signal, np.ndarray):
                entry_regime_signal = pd.Series(entry_regime_signal, index=regime_df.index)
            entry_regime_signal = entry_regime_signal.reindex(df.index, method='ffill').fillna(False)
            
            # Only allow entries when regime condition is met
            allow_entries = entry_regime_signal

        # Modify entry signals based on regime permission
        entry = entry & allow_entries

        # Exit regime handling
        if exit_regime and regime_exit_action:
            exit_regime_signal = exit_regime.evaluate(regime_df)
            if isinstance(exit_regime_signal, np.ndarray):
                exit_regime_signal = pd.Series(exit_regime_signal, index=regime_df.index)
            exit_regime_signal = exit_regime_signal.reindex(df.index, method='ffill').fillna(False)
            
            # Force exit when regime exit condition is met
            exit = exit | exit_regime_signal

    # Convert to numpy arrays for performance
    entry = entry.values
    exit = exit.values
    position = position.values
    in_position = in_position.values

    # Process signals through time
    for i in range(1, len(df)):
        if entry[i] and not in_position[i - 1]:  # New entry
            position[i] = position_type
        elif exit[i] and in_position[i - 1]:  # Exit
            position[i] = 0
        else:  # Maintain previous position
            position[i] = position[i - 1]

        in_position[i] = position[i] != 0

    return pd.Series(position, index=df.index)