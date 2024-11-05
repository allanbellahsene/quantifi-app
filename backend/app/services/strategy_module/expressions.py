# expressions.py

from dataclasses import dataclass, field
from typing import Union, Optional, Literal, Tuple, List
import pandas as pd
import numpy as np
import re
from app.services.strategy_module.indicators import INDICATORS

@dataclass(frozen=True)
class Indicator:
    name: str
    params: Tuple = field(default_factory=tuple)

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
        """Evaluate the rule on the given DataFrame."""
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
            if indicator.name == 'VWAP':
                # For VWAP, pass the whole DataFrame
                return INDICATORS[indicator.name](df).values
            else:
                column_name = indicator.params[0]
                if column_name not in df.columns:
                    raise ValueError(f"Column {column_name} not found in DataFrame")
                params = [df[column_name]] + [int(param) for param in indicator.params[1:]]
                return INDICATORS[indicator.name](*params).values
        else:
            raise ValueError(f"Unknown indicator: {indicator.name}")

@dataclass
class CompositeRule:
    rule: Union[Rule, 'CompositeRule']
    logic: Optional[Literal['and', 'or']] = None
    next_rule: Optional[Union[Rule, 'CompositeRule']] = None

    def evaluate(self, df: pd.DataFrame) -> np.ndarray:
        """Evaluate the composite rule on the given DataFrame."""
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

def parse_rule(rule_str: str) -> CompositeRule:
    """Parse a rule string into a CompositeRule object."""
    print(f"Parsing rule: {rule_str}")
    def parse_single_rule(rule: str) -> Rule:
        for op in ['<=', '>=', '==', '!=', '<', '>']:
            if op in rule:
                left, right = rule.split(op)
                left_indicator = parse_indicator(left.strip())
                try:
                    right_value = float(right.strip())
                except ValueError:
                    right_value = parse_indicator(right.strip())
                print(f"Parsed single rule: {left_indicator} {op} {right_value}")
                return Rule(left_indicator, op, right_value)
        raise ValueError(f"Invalid rule: {rule}. No valid operator found.")

    # Split the rule into parts based on 'and'/'or' logical operators
    tokens = re.split(r'\s+', rule_str)
    rules = []
    logic_ops = []
    current_rule = []

    for token in tokens:
        if token in ['and', 'or']:
            rules.append(parse_single_rule(' '.join(current_rule)))
            logic_ops.append(token)
            current_rule = []
        else:
            current_rule.append(token)
    rules.append(parse_single_rule(' '.join(current_rule)))

    # Build the composite rule
    composite_rule = CompositeRule(rules[0])
    current_composite = composite_rule
    for i, logic in enumerate(logic_ops):
        next_rule = CompositeRule(rules[i + 1])
        current_composite.logic = logic
        current_composite.next_rule = next_rule
        current_composite = next_rule

    print(f"Parsed composite rule: {composite_rule}")
    return composite_rule
