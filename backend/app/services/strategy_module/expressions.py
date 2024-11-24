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
class CompositeIndicator:
    function: str
    indicators: List[Indicator]

    def __str__(self):
        indicators_str = ', '.join(str(ind) for ind in self.indicators)
        return f"{self.function}({indicators_str})"



@dataclass
class Rule:
    left: Indicator
    operator: Literal['<', '<=', '>', '>=', '==', '!=']
    right: Union[Indicator, float]

    def evaluate(self, df: pd.DataFrame) -> np.ndarray:
        """Evaluate the rule on the given DataFrame."""
        left_values = self._get_indicator_values(self.left, df)

        if isinstance(self.right, (Indicator, CompositeIndicator)):
            right_values = self._get_indicator_values(self.right, df)
        else:
            right_values = np.full(len(df), self.right)

        # Perform the comparison
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


    def _get_indicator_values(self, indicator: Union[Indicator, CompositeIndicator], df: pd.DataFrame) -> np.ndarray:
        if isinstance(indicator, float):
            # Return an array filled with the constant value
            return np.full(len(df), indicator)
        elif isinstance(indicator, CompositeIndicator):
            return self._evaluate_composite_indicator(indicator, df)
        elif isinstance(indicator, Indicator):
            # Evaluate simple indicators
            if indicator.name in ['Open', 'High', 'Low', 'Close', 'Volume', 'BTC-USD']:
                return df[indicator.name].values
            elif indicator.name in df.columns:
                return df[indicator.name].values
            elif indicator.name in INDICATORS:
                # Handle indicator functions
                if indicator.name == 'VWAP' or indicator.name == 'Average_Move_From_Open':
                    # For VWAP, pass the whole DataFrame
                    return INDICATORS[indicator.name](df).values
                else:
                    # Prepare parameters for the indicator function
                    params = []
                    for param in indicator.params:
                        if isinstance(param, (int, float)):
                            params.append(param)
                        elif isinstance(param, pd.Series):
                            params.append(param)
                        elif isinstance(param, str):
                            if param in df.columns:
                                # Parameter is a column name
                                params.append(df[param])
                            else:
                                # Try parsing parameter as an indicator
                                sub_indicator = parse_indicator(param)
                                param_values = self._get_indicator_values(sub_indicator, df)
                                params.append(param_values)
                        else:
                            raise ValueError(f"Invalid parameter type: {param}")
                    # Call the indicator function with evaluated parameters
                    return INDICATORS[indicator.name](*params).values
            else:
                raise ValueError(f"Unknown indicator: {indicator.name}")
        else:
            raise ValueError(f"Unsupported indicator type: {type(indicator)}")

    def _evaluate_composite_indicator(self, composite_indicator: CompositeIndicator, df: pd.DataFrame) -> np.ndarray:
        # Evaluate each indicator in the composite indicator
        indicator_values = [self._get_indicator_values(ind, df) for ind in composite_indicator.indicators]
        # Apply the function to the indicator values
        if composite_indicator.function == 'shift':
            if len(indicator_values) != 2:
                raise ValueError("Shift function requires exactly two parameters: indicator and periods")
            series = indicator_values[0]
            periods = indicator_values[1]
            # Ensure periods is an integer
            if isinstance(periods, np.ndarray):
                periods = periods[0]  # Extract the scalar value
            if not isinstance(periods, (int, float)):
                raise ValueError("Shift periods must be a number")
            return pd.Series(series).shift(int(periods)).values
        elif composite_indicator.function == 'max':
            return np.maximum.reduce(indicator_values)
        elif composite_indicator.function == 'min':
            return np.minimum.reduce(indicator_values)
        elif composite_indicator.function == 'mean':
            return np.mean(indicator_values, axis=0)
        elif composite_indicator.function == 'add':
            return np.sum(indicator_values, axis=0)
        elif composite_indicator.function == 'subtract':
            if len(indicator_values) != 2:
                raise ValueError("Subtract function requires exactly two indicators")
            return indicator_values[0] - indicator_values[1]
        elif composite_indicator.function == 'multiply':
            return np.prod(indicator_values, axis=0)
        elif composite_indicator.function == 'divide':
            if len(indicator_values) != 2:
                raise ValueError("Divide function requires exactly two indicators")
            denominator = indicator_values[1]
            with np.errstate(divide='ignore', invalid='ignore'):
                result = np.true_divide(indicator_values[0], denominator)
                result[~np.isfinite(result)] = np.nan  # Replace -inf, inf, NaN with NaN
            return result
        else:
            raise ValueError(f"Unsupported function in composite indicator: {composite_indicator.function}")


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


import re
from typing import Union

def parse_indicator(indicator_str: str) -> Union[Indicator, CompositeIndicator, float]:
    print(f"Parsing indicator: {indicator_str}")
    # First, check if indicator_str is a number (constant)
    if is_number(indicator_str):
        return float(indicator_str)
    
    # Update regex to include 'shift'
    composite_match = re.match(r'(max|min|mean|add|subtract|multiply|divide|shift)\((.*)\)', indicator_str)
    if composite_match:
        function_name, params_str = composite_match.groups()
        # Split the parameters, which may include nested functions
        params = split_params(params_str)
        indicators = [parse_indicator(param.strip()) for param in params]
        return CompositeIndicator(function=function_name, indicators=indicators)

    # Handle base price columns without parameters
    if indicator_str in ['Open', 'High', 'Low', 'Close', 'Volume', 'BTC-USD']:
        return Indicator(indicator_str)

    # Handle empty or missing parameters
    if indicator_str.endswith('()'):
        base_name = indicator_str[:-2]
        if base_name in ['Open', 'High', 'Low', 'Close', 'Volume', 'BTC-USD']:
            return Indicator(base_name)
        else:
            raise ValueError(f"Invalid indicator without parameters: {indicator_str}")

    # Parse indicators with parameters
    match = re.match(r'([\w-]+)\((.*)\)', indicator_str)
    if not match:
        raise ValueError(f"Invalid indicator format: {indicator_str}")
    
    name, params_str = match.groups()
    params = [param.strip() for param in params_str.split(',') if param.strip()]
    
    # For indicators requiring series parameter, ensure correct order and defaults
    if name in ['SMA', 'EMA', 'Rolling_High', 'Rolling_Low', 'MA_trend']:
        parsed_params = []
        if not params:
            # If no parameters provided, use defaults
            if name in ['SMA', 'EMA']:
                parsed_params = ['Close', 20]  # Default to Close with 20 period window
            elif name in ['Rolling_High', 'Rolling_Low']:
                parsed_params = ['Close', 14]  # Default to Close with 14 period window
            elif name == 'MA_trend':
                parsed_params = ['Close', 20, 5]  # Default values for MA_trend
        else:
            # Process provided parameters
            series_param = 'Close'  # Default series
            numeric_params = []
            
            for param in params:
                if param.isdigit() or is_number(param):
                    numeric_params.append(int(param) if param.isdigit() else float(param))
                else:
                    series_param = param
            
            if name == 'MA_trend':
                if len(numeric_params) == 2:
                    parsed_params = [series_param] + numeric_params
                else:
                    raise ValueError(f"MA_trend requires series and two numeric parameters: {params_str}")
            else:
                if len(numeric_params) == 1:
                    parsed_params = [series_param, numeric_params[0]]
                else:
                    raise ValueError(f"{name} requires series and one numeric parameter: {params_str}")
    else:
        # For other indicators, parse parameters normally
        parsed_params = []
        for param in params:
            if param.isdigit():
                parsed_params.append(int(param))
            elif is_number(param):
                parsed_params.append(float(param))
            else:
                parsed_params.append(param)

    print(f"Parsed indicator: {name} with params: {parsed_params}")
    return Indicator(name, tuple(parsed_params))

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False
def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

def split_params(params_str: str) -> List[str]:
    # This function handles splitting parameters that may include nested parentheses
    params = []
    bracket_level = 0
    current_param = ''
    for char in params_str:
        if char == ',' and bracket_level == 0:
            params.append(current_param)
            current_param = ''
        else:
            if char == '(':
                bracket_level += 1
            elif char == ')':
                bracket_level -= 1
            current_param += char
    if current_param:
        params.append(current_param)
    return params


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
