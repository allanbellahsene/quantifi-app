#app.services.backtest.strategies.py

import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from typing import List, Literal, Union, Dict, Callable, Optional
import re


# INDICATOR FUNCTIONS
def SMA(series: pd.Series, window: int) -> pd.Series:
    """Calculate Simple Moving Average"""
    return series.rolling(window=window).mean().shift()

def EMA(series: pd.Series, window: int) -> pd.Series:
    """Calculate Exponential Moving Average"""
    return series.ewm(span=window, adjust=False).mean().shift()

def rolling_high(series: pd.Series, window: int) -> pd.Series:
    """Calculate Rolling High"""
    return series.rolling(window=window).max().shift()

def rolling_low(series: pd.Series, window: int) -> pd.Series:
    """Calculate Rolling Low"""
    return series.rolling(window=window).min().shift()

def MA_trend(series: pd.Series, ma_window: int, return_window: int) -> pd.Series:
    """Calculate the trend of a moving average"""
    ma = series.rolling(window=ma_window).mean()
    return ma.pct_change(periods=return_window)

# Dictionary of available indicators
INDICATORS: Dict[str, Callable] = {
    'SMA': SMA,
    'EMA': EMA,
    'Rolling_High': rolling_high,
    'Rolling_Low': rolling_low,
    'MA_trend': MA_trend
}

@dataclass(frozen=True)
class Indicator:
    name: str
    params: tuple = field(default_factory=tuple)

    def __post_init__(self):
        object.__setattr__(self, 'params', tuple(self.params))

    def __str__(self):
        if self.params:
            return f"{self.name}({', '.join(map(str, self.params))})"
        else:
            return f"{self.name}"

@dataclass
class Rule:
    left: Indicator
    operator: Literal['<', '<=', '>', '>=', '==', '!=']
    right: Union[Indicator, float]

    def evaluate(self, df: pd.DataFrame) -> np.ndarray:
        """Evaluate the rule on the given DataFrame"""
        left_values = self._get_indicator_values(self.left, df)

        if isinstance(self.right, Indicator):
            right_values = self._get_indicator_values(self.right, df)
        else:
            right_values = np.full(len(df), self.right)

        if self.operator == '<':
            return left_values < right_values
        elif self.operator == '<=':
            return left_values <= right_values
        elif self.operator == '>':
            return left_values > right_values
        elif self.operator == '>=':
            return left_values >= right_values
        elif self.operator == '==':
            return left_values == right_values
        elif self.operator == '!=':
            return left_values != right_values
        else:
            raise ValueError(f"Unsupported operator: {self.operator}")

    def _get_indicator_values(self, indicator: Indicator, df: pd.DataFrame) -> np.ndarray:
        if indicator.name in ['Open', 'High', 'Low', 'Close', 'Volume', 'BTC-USD']:
            return df[indicator.name].values
        elif indicator.name in df.columns:
            return df[indicator.name].values
        elif indicator.name in INDICATORS:
            column_name = indicator.params[0]
            if column_name not in df.columns:
                raise ValueError(f"Column {column_name} not found in DataFrame")
            
            if indicator.name == 'MA_trend':
                return INDICATORS[indicator.name](df[column_name], *indicator.params[1:]).values
            else:
                return INDICATORS[indicator.name](df[column_name], *indicator.params[1:]).values
        else:
            raise ValueError(f"Unknown indicator: {indicator.name}")

@dataclass
class CompositeRule:
    rule: Union[Rule, 'CompositeRule']
    logic: Optional[Literal['and', 'or']] = None
    next_rule: Optional[Union[Rule, 'CompositeRule']] = None

    def evaluate(self, df: pd.DataFrame) -> np.ndarray:
        """Evaluate the composite rule on the given DataFrame"""
        result = self.rule.evaluate(df)
        if self.logic is None or self.next_rule is None:
            return result

        next_result = self.next_rule.evaluate(df)
        if self.logic == 'and':
            return result & next_result
        elif self.logic == 'or':
            return result | next_result
        else:
            raise ValueError(f"Unsupported logic: {self.logic}")

def parse_indicator(indicator_str: str) -> Indicator:
    print(f"Parsing indicator: {indicator_str}")
    if indicator_str in ['Open', 'High', 'Low', 'Close', 'Volume', 'BTC-USD']:
        return Indicator(indicator_str, ())
    match = re.match(r'([\w-]+)\((.*)\)', indicator_str)
    if not match:
        raise ValueError(f"Invalid indicator format: {indicator_str}")
    name, params_str = match.groups()
    params = [param.strip() for param in params_str.split(',')]
    parsed_params = ['Close']  # Default to 'Close' as the first parameter
    for param in params:
        if param.isdigit():
            parsed_params.append(int(param))
        elif param.replace('.', '').isdigit():
            parsed_params.append(float(param))
        else:
            parsed_params.append(param)
    print(f"Parsed indicator: {name} with params: {parsed_params}")
    return Indicator(name, tuple(parsed_params))

def parse_rule_old(rule_str: str) -> CompositeRule:
    """Parse a rule string into a CompositeRule object"""
    print(f"Parsing rule: {rule_str}")
    def parse_single_rule(rule: str) -> Rule:
        for op in ['<=', '>=', '==', '!=', '<', '>']:
            if op in rule:
                left, right = rule.split(op)
                try:
                    left_indicator = parse_indicator(left.strip())
                except ValueError as e:
                    raise ValueError(f"Error parsing left side of rule '{rule}': {str(e)}")
                try:
                    right_value = float(right.strip())
                except ValueError:
                    try:
                        right_value = parse_indicator(right.strip())
                    except ValueError as e:
                        raise ValueError(f"Error parsing right side of rule '{rule}': {str(e)}")
                #print(f"Parsed single rule: {left_indicator} {op} {right_value}")
                return Rule(left_indicator, op, right_value)
        raise ValueError(f"Invalid rule: {rule}. No valid operator found.")

    parts = rule_str.split()
    if 'and' not in parts and 'or' not in parts:
        return CompositeRule(parse_single_rule(rule_str))

    rules = []
    logic_ops = []
    current_rule = []

    for part in parts:
        if part in ['and', 'or']:
            rules.append(parse_single_rule(' '.join(current_rule)))
            logic_ops.append(part)
            current_rule = []
        else:
            current_rule.append(part)

    rules.append(parse_single_rule(' '.join(current_rule)))

    composite_rule = CompositeRule(rules[0])
    current_rule = composite_rule
    for i, logic in enumerate(logic_ops):
        new_rule = CompositeRule(rules[i+1])
        current_rule.logic = logic
        current_rule.next_rule = new_rule
        current_rule = new_rule

    print(f"Parsed composite rule: {composite_rule}")
    return composite_rule

def parse_rule(rule_str: str) -> CompositeRule:
    """Parse a rule string into a CompositeRule object"""
    print(f"Parsing rule: {rule_str}")
    def parse_single_rule(rule: str) -> Rule:
        for op in ['<=', '>=', '==', '!=', '<', '>']:
            if op in rule:
                left, right = rule.split(op)
                try:
                    left_indicator = parse_indicator(left.strip())
                except ValueError as e:
                    raise ValueError(f"Error parsing left side of rule '{rule}': {str(e)}")
                try:
                    right_value = float(right.strip())
                except ValueError:
                    try:
                        right_value = parse_indicator(right.strip())
                    except ValueError as e:
                        raise ValueError(f"Error parsing right side of rule '{rule}': {str(e)}")
                print(f"Parsed single rule: {left_indicator} {op} {right_value}")
                return Rule(left_indicator, op, right_value)
        raise ValueError(f"Invalid rule: {rule}. No valid operator found.")

    parts = rule_str.split()
    if 'and' not in parts and 'or' not in parts:
        return CompositeRule(parse_single_rule(rule_str))

    rules = []
    logic_ops = []
    current_rule = []

    for part in parts:
        if part in ['and', 'or']:
            rules.append(parse_single_rule(' '.join(current_rule)))
            logic_ops.append(part)
            current_rule = []
        else:
            current_rule.append(part)

    rules.append(parse_single_rule(' '.join(current_rule)))

    composite_rule = CompositeRule(rules[0])
    current_rule = composite_rule
    for i, logic in enumerate(logic_ops):
        new_rule = CompositeRule(rules[i+1])
        current_rule.logic = logic
        current_rule.next_rule = new_rule
        current_rule = new_rule

    print(f"Parsed composite rule: {composite_rule}")
    return composite_rule

def generate_signals(df: pd.DataFrame, entry_signal: CompositeRule, exit_signal: CompositeRule, position_type: int = 1) -> pd.Series:
    """Generate trading signals based on entry and exit rules"""
    entry: np.ndarray = entry_signal.evaluate(df)
    exit: np.ndarray = exit_signal.evaluate(df)


    position: np.ndarray = np.zeros(len(df), dtype=int)
    in_position: np.ndarray = np.zeros(len(df), dtype=bool)

    position = np.where(entry, position_type, position)

    for i in range(1, len(df)):
        if position[i] == 0:  # If no new signal
            if in_position[i-1] and not exit[i]:
                position[i] = position_type
            elif in_position[i-1] and exit[i]:
                position[i] = 0
            else:
                position[i] = position[i-1]

        in_position[i] = position[i] != 0

    return pd.Series(position, index=df.index)

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

    def __post_init__(self):
        print(f"Initializing strategy: {self.name}")
        try:
            self.entry_rules: CompositeRule = parse_rule(self.entry_rules)
            self.exit_rules: CompositeRule = parse_rule(self.exit_rules)
            self.position_type: int = 1 if self.position_type == 'long' else -1
            self.regime_filter: Optional[CompositeRule] = parse_rule(self.regime_filter) if self.regime_filter else None
            print(f"Strategy {self.name} initialized successfully")
        except ValueError as e:
            print(f"Error initializing strategy {self.name}: {str(e)}")
            raise

    def generate_signals(self, df: pd.DataFrame) -> pd.Series:
        """Generate trading signals for the strategy"""
        signals = generate_signals(df, self.entry_rules, self.exit_rules, self.position_type)
        if self.regime_filter:
            regime = self.regime_filter.evaluate(df)
            signals = signals * regime
        return signals
    
    def calculate_position_sizes(self, df: pd.DataFrame) -> pd.Series:
        if self.position_size_method == 'fixed':
            if self.fixed_position_size is None:
                raise ValueError('fixed_position_size must be set when position_size_method is "fixed"')
            position_sizes = pd.Series(self.fixed_position_size, df.index)
            if self.fixed_position_size > self.max_leverage:
                print(f'Fixed position size is larger than max allowed leverage. Please re-adjust.')
        elif self.position_size_method == 'volatility_target':
            returns = df['Close'].pct_change()
            realized_vol = returns.ewm(span=self.volatility_lookback).std().shift() * np.sqrt(365)
            volatility_estimate = realized_vol.ewm(span=self.volatility_lookback).mean().shift()
            position_sizes = (self.volatility_target / 100)  / volatility_estimate #because frontend receives percentage
            # Apply buffer to adjust position sizes when volatility deviates
            if self.volatility_buffer is not None:
                deviation = (volatility_estimate.shift() - self.volatility_target).abs() / self.volatility_target
                adjust_condition = deviation > (self.volatility_buffer / 100) #frontend receives percentage
                # Adjust position sizes only when deviation exceeds buffer
                position_sizes = position_sizes.where(adjust_condition, np.nan)
                # Forward-fill the position sizes when no adjustment is needed
                position_sizes.ffill(inplace=True)
        else:
            raise ValueError(f"Unknown position sizing method: {self.position_size_method}")
    
        position_sizes = position_sizes.clip(upper=self.max_leverage)
        position_sizes = position_sizes.fillna(1) #fillna with 1 - it's fine because what ultimately decides if we have a position is the signal column. So if that column is zero this wont do anything.
        return position_sizes

def add_indicators(df: pd.DataFrame, strategies: List[Strategy]) -> pd.DataFrame:
    """Add the required indicators to the DataFrame based on the strategies"""
    all_indicators = set()

    def collect_indicators(rule):
        print(f"Collecting indicators from rule: {rule}")
        if isinstance(rule, Rule):
            all_indicators.add(rule.left)
            if isinstance(rule.right, Indicator):
                all_indicators.add(rule.right)
        elif isinstance(rule, CompositeRule):
            collect_indicators(rule.rule)
            if rule.next_rule:
                collect_indicators(rule.next_rule)

    for strategy in strategies:
        print(f"Collecting indicators for strategy: {strategy.name}")
        collect_indicators(strategy.entry_rules)
        collect_indicators(strategy.exit_rules)
        if strategy.regime_filter:
            collect_indicators(strategy.regime_filter)

    print("All collected indicators:")
    for indicator in all_indicators:
        print(f"  {indicator}")

    for indicator in all_indicators:
        if indicator.name in INDICATORS:
            print(f"Adding indicator: {indicator}")
            if indicator.name in ['SMA', 'EMA', 'Rolling_High', 'Rolling_Low']:
                # These indicators expect a series and a window
                df[str(indicator)] = INDICATORS[indicator.name](df[indicator.params[0]], int(indicator.params[1]))
            else:
                # For other indicators, pass all parameters
                df[str(indicator)] = INDICATORS[indicator.name](df[indicator.params[0]], *indicator.params[1:])

    return df