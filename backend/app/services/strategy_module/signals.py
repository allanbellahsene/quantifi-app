# signals.py

import pandas as pd
import numpy as np
from app.services.strategy_module.expressions import CompositeRule

def generate_signals(df: pd.DataFrame, entry_signal: CompositeRule, exit_signal: CompositeRule, position_type: int = 1) -> pd.Series:
    """Generate trading signals based on entry and exit rules."""
    entry: np.ndarray = entry_signal.evaluate(df)
    exit: np.ndarray = exit_signal.evaluate(df)

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
