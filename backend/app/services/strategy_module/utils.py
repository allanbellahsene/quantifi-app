# utils.py

import pandas as pd
from typing import List, Set
from app.services.strategy_module.indicators import INDICATORS
from app.services.strategy_module.expressions import Indicator, Rule, CompositeRule
from app.services.strategy_module.strategy import Strategy

def add_indicators(df: pd.DataFrame, strategies: List[Strategy]) -> pd.DataFrame:
    """Add the required indicators to the DataFrame based on the strategies."""
    all_indicators: Set[Indicator] = set()

    def collect_indicators(rule):
        if isinstance(rule, Rule):
            all_indicators.add(rule.left)
            if isinstance(rule.right, Indicator):
                all_indicators.add(rule.right)
        elif isinstance(rule, CompositeRule):
            collect_indicators(rule.rule)
            if rule.next_rule:
                collect_indicators(rule.next_rule)

    for strategy in strategies:
        collect_indicators(strategy.entry_rules)
        collect_indicators(strategy.exit_rules)
        if strategy.regime_filter:
            collect_indicators(strategy.regime_filter)

    for indicator in all_indicators:
        if indicator.name in INDICATORS:
            print(f"Adding indicator: {indicator}")
            if indicator.name == 'VWAP':
                df[str(indicator)] = INDICATORS[indicator.name](df)
            else:
                # Prepare parameters
                params = []
                for param in indicator.params:
                    try:
                        params.append(int(param))
                    except ValueError:
                        if param in df.columns:
                            params.append(df[param])
                        else:
                            raise ValueError(f"Parameter {param} not found in DataFrame columns.")
                df[str(indicator)] = INDICATORS[indicator.name](*params)
    return df
