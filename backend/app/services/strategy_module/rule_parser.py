# app/services/strategy_module/rule_parser.py
from typing import List
from app.models.backtest import IndicatorInput, RuleInput
import logging

logger = logging.getLogger(__name__)

def construct_indicator_string(indicator: IndicatorInput) -> str:
    """
    Constructs a string representation of an indicator for use in strategy rules.
    """
    try:
        if not indicator:
            raise ValueError("Indicator cannot be None")

        if indicator.type == 'simple':
            return _construct_simple_indicator(indicator)
        elif indicator.type == 'composite':
            return _construct_composite_indicator(indicator)
        else:
            raise ValueError(f"Unknown indicator type: {indicator.type}")
            
    except Exception as e:
        logger.error(f"Error constructing indicator string: {str(e)}", extra={"indicator": indicator})
        raise

def _construct_simple_indicator(indicator: IndicatorInput) -> str:
    """Helper function to construct simple indicator strings."""
    if not indicator.name:
        raise ValueError("Simple indicator must have a name")
    
    if indicator.name in ['Open', 'High', 'Low', 'Close', 'Volume', 'BTC-USD']:
        return f"{indicator.name}()"
    
    params = []
    if indicator.params:
        for param_name in indicator.params:
            param_value = indicator.params[param_name]
            if param_name == 'series' and not param_value:
                param_value = 'Close'
            params.append(str(param_value))
    
    return f"{indicator.name}({','.join(params)})" if params else f"{indicator.name}()"

def _construct_composite_indicator(indicator: IndicatorInput) -> str:
    """Helper function to construct composite indicator strings."""
    if not indicator.expression:
        raise ValueError("Composite indicator must have an expression")
    return indicator.expression

def construct_rule_string(rules: List[RuleInput]) -> str:
    """
    Constructs a string representation of a list of rules for strategy evaluation.
    """
    try:
        rule_strings = []
        for index, rule in enumerate(rules):
            rule_str = _construct_single_rule(rule, index)
            rule_strings.append(rule_str)
            
        return " ".join(rule_strings)
    except Exception as e:
        logger.error(f"Error constructing rule string: {str(e)}", extra={"rules": rules})
        raise

def _construct_single_rule(rule: RuleInput, index: int) -> str:
    """Helper function to construct a single rule string."""
    if not rule.leftIndicator:
        raise ValueError(f"Rule {index + 1} is missing left indicator")
    
    left = construct_indicator_string(rule.leftIndicator)
    
    if rule.useRightIndicator:
        if not rule.rightIndicator:
            raise ValueError(f"Rule {index + 1} is set to use right indicator but no indicator is provided")
        right = construct_indicator_string(rule.rightIndicator)
    else:
        if not rule.rightValue and rule.rightValue != '0':
            raise ValueError(f"Rule {index + 1} needs either a right indicator or a value")
        right = rule.rightValue
    
    rule_str = f"{left} {rule.operator} {right}"
    
    if index > 0:
        rule_str = f"{rule.logicalOperator} {rule_str}"
    
    return rule_str