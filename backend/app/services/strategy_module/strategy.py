# strategy.py

from dataclasses import dataclass
from typing import Optional, Literal, List
import pandas as pd
import numpy as np
from app.services.strategy_module.expressions import parse_rule, CompositeRule
from app.services.strategy_module.signals import generate_signals

@dataclass
class Strategy:
    name: str
    entry_rules: str
    exit_rules: str
    position_type: Literal['long', 'short']
    active: bool = True
    regime_filter: Optional[str] = None
    position_size_method: Literal['fixed', 'volatility_target'] = 'fixed'
    fixed_position_size: Optional[float] = None
    volatility_target: Optional[float] = None
    volatility_lookback: Optional[int] = 30
    volatility_buffer: Optional[float] = None  # Buffer percentage for volatility adjustments
    max_leverage: float = 1.0
    frequency: str = 'Daily'

    def __post_init__(self):
        print(f"Initializing strategy: {self.name}")
        try:
            self.entry_rules: CompositeRule = parse_rule(self.entry_rules)
            self.exit_rules: CompositeRule = parse_rule(self.exit_rules)
            self.position_type_value: int = 1 if self.position_type == 'long' else -1
            self.regime_filter: Optional[CompositeRule] = parse_rule(self.regime_filter) if self.regime_filter else None
            print(f"Strategy {self.name} initialized successfully")
        except ValueError as e:
            print(f"Error initializing strategy {self.name}: {str(e)}")
            raise

    def generate_signals(self, df: pd.DataFrame) -> pd.Series:
        """Generate trading signals for the strategy."""
        signals = generate_signals(df, self.entry_rules, self.exit_rules, self.position_type_value)
        if self.regime_filter:
            regime = self.regime_filter.evaluate(df)
            signals = signals * regime
        return signals

    def calculate_position_sizes(self, df: pd.DataFrame) -> pd.Series:
        """Calculate position sizes based on the strategy's sizing method."""
        if self.position_size_method == 'fixed':
            if self.fixed_position_size is None:
                raise ValueError('fixed_position_size must be set when position_size_method is "fixed"')
            position_sizes = pd.Series(self.fixed_position_size, index=df.index)
            if self.fixed_position_size > self.max_leverage:
                print('Fixed position size is larger than max allowed leverage. Please re-adjust.')
        elif self.position_size_method == 'volatility_target':
            if self.volatility_target is None:
                raise ValueError('volatility_target must be set when position_size_method is "volatility_target"')
            returns = df['Close'].pct_change()
            realized_vol = returns.ewm(span=self.volatility_lookback).std().shift() * np.sqrt(365)
            volatility_estimate = realized_vol.ewm(span=self.volatility_lookback).mean().shift()
            position_sizes = (self.volatility_target / 100) / volatility_estimate  # Frontend receives percentage
            # Apply buffer to adjust position sizes when volatility deviates
            if self.volatility_buffer is not None:
                deviation = (volatility_estimate.shift() - self.volatility_target).abs() / self.volatility_target
                adjust_condition = deviation > (self.volatility_buffer / 100)  # Frontend receives percentage
                # Adjust position sizes only when deviation exceeds buffer
                position_sizes = position_sizes.where(adjust_condition, np.nan)
                # Forward-fill the position sizes when no adjustment is needed
                position_sizes.ffill(inplace=True)
        else:
            raise ValueError(f"Unknown position sizing method: {self.position_size_method}")

        position_sizes = position_sizes.clip(upper=self.max_leverage)
        position_sizes = position_sizes.fillna(1)  # Fill NaN with 1; signals determine position
        return position_sizes
