# app/services/strategy_service/strategy.py

from typing import List, Tuple, Dict
import pandas as pd
from app.models.backtest import StrategyInput
from app.services.strategy_module.rule_parser import construct_rule_string
from app.services.backtest.run_backtest import Strategy, run_backtest
import logging
import json

logger = logging.getLogger(__name__)

class StrategyService:
    def __init__(self, strategies: List[StrategyInput], fees: float, slippage: float):
        self.strategies = strategies
        # Log the initial strategy data
        for strategy in strategies:
            logger.info(f"""
==== Strategy Input Data ====
Strategy Name: {strategy.name}
Entry Rules: {[{
    'leftIndicator': {
        'type': rule.leftIndicator.type,
        'name': rule.leftIndicator.name,
        'params': rule.leftIndicator.params if hasattr(rule.leftIndicator, 'params') else None
    },
    'operator': rule.operator,
    'useRightIndicator': rule.useRightIndicator,
    'rightIndicator': {
        'type': rule.rightIndicator.type if rule.rightIndicator else None,
        'name': rule.rightIndicator.name if rule.rightIndicator else None,
        'params': rule.rightIndicator.params if rule.rightIndicator and hasattr(rule.rightIndicator, 'params') else None
    } if rule.rightIndicator else None,
    'rightValue': rule.rightValue
} for rule in strategy.entryRules]}
Exit Rules: {[{
    'leftIndicator': {
        'type': rule.leftIndicator.type,
        'name': rule.leftIndicator.name,
        'params': rule.leftIndicator.params if hasattr(rule.leftIndicator, 'params') else None
    },
    'operator': rule.operator,
    'useRightIndicator': rule.useRightIndicator,
    'rightIndicator': {
        'type': rule.rightIndicator.type if rule.rightIndicator else None,
        'name': rule.rightIndicator.name if rule.rightIndicator else None,
        'params': rule.rightIndicator.params if rule.rightIndicator and hasattr(rule.rightIndicator, 'params') else None
    } if rule.rightIndicator else None,
    'rightValue': rule.rightValue
} for rule in strategy.exitRules]}
============================
            """)
        self.fees = fees
        self.slippage = slippage

    async def process_strategies(self, data_dict: Dict[str, pd.DataFrame]) -> Tuple[List, List, List]:
        """
        Processes all strategies and returns results.
        """
        strategies_results = []
        strategies_info = []
        strategies_df_results = []

        for strategy in self.strategies:
            try:
                df = data_dict.get(strategy.frequency)
                if df is None:
                    raise ValueError(f"No data found for frequency: {strategy.frequency}")
                
                results = await self._process_single_strategy(strategy, df)
                strategies_results.append(results[0])
                strategies_info.append(results[1])
                strategies_df_results.append(results[2])
            except Exception as e:
                logger.error(f"Error processing strategy {strategy.name}: {str(e)}")
                raise

        return strategies_results, strategies_info, strategies_df_results

    async def _process_single_strategy(self, strategy: StrategyInput, df: pd.DataFrame) -> Tuple:
        """
        Processes a single strategy and returns its results.
        """
        try:
            logger.info(f"Processing strategy: {strategy.name}")
            
            # Log strategy data for debugging
            logger.debug(f"Strategy data: {json.dumps({
                'name': strategy.name,
                'entryRules': [{
                    'leftIndicator': vars(rule.leftIndicator),
                    'operator': rule.operator,
                    'useRightIndicator': rule.useRightIndicator,
                    'rightIndicator': vars(rule.rightIndicator) if rule.rightIndicator else None,
                    'rightValue': rule.rightValue
                } for rule in strategy.entryRules],
                'exitRules': [{
                    'leftIndicator': vars(rule.leftIndicator),
                    'operator': rule.operator,
                    'useRightIndicator': rule.useRightIndicator,
                    'rightIndicator': vars(rule.rightIndicator) if rule.rightIndicator else None,
                    'rightValue': rule.rightValue
                } for rule in strategy.exitRules]
            }, indent=2, default=str)}")
            
            # Validate rules
            self._validate_strategy_rules(strategy)
            
            # Construct rule strings
            entry_rules = construct_rule_string(strategy.entryRules)
            exit_rules = construct_rule_string(strategy.exitRules)
            
            logger.debug(f"Constructed entry rules: {entry_rules}")
            logger.debug(f"Constructed exit rules: {exit_rules}")
            
            # Initialize strategy parameters
            position_params = self._initialize_position_parameters(strategy)
            
            # Create strategy instance
            strategy_instance = self._create_strategy_instance(
                strategy, entry_rules, exit_rules, position_params
            )
            
            # Run backtest
            df_result = run_backtest(df.copy(), strategy_instance, self.fees, self.slippage)
            
            return df_result, strategy_instance, df_result.copy()
            
        except Exception as e:
            logger.error(f"Error processing strategy {strategy.name}: {str(e)}")
            raise

    def _validate_strategy_rules(self, strategy: StrategyInput):
        """Validates strategy rules."""
        for rule_type, rules in [("entry", strategy.entryRules), ("exit", strategy.exitRules)]:
            for i, rule in enumerate(rules):
                logger.info(f"""
==== Validating {rule_type} rule {i+1} ====
Left Indicator:
  - Type: {rule.leftIndicator.type if rule.leftIndicator else None}
  - Name: {rule.leftIndicator.name if rule.leftIndicator else None}
  - Params: {rule.leftIndicator.params if hasattr(rule.leftIndicator, 'params') else None}
Operator: {rule.operator}
Use Right Indicator: {rule.useRightIndicator}
Right Indicator:
  - Type: {rule.rightIndicator.type if rule.rightIndicator else None}
  - Name: {rule.rightIndicator.name if rule.rightIndicator else None}
  - Params: {rule.rightIndicator.params if rule.rightIndicator and hasattr(rule.rightIndicator, 'params') else None}
Right Value: {rule.rightValue}
============================
                """)

                # Basic validation for left indicator
                if not rule.leftIndicator:
                    raise ValueError(f"Strategy '{strategy.name}' {rule_type} rule {i+1} is missing left indicator")
                if rule.leftIndicator.type == 'simple' and not rule.leftIndicator.name:
                    raise ValueError(f"Strategy '{strategy.name}' {rule_type} rule {i+1} left indicator missing name")

                # Right side validation
                if rule.useRightIndicator:
                    # If useRightIndicator is True, we must have a rightIndicator
                    if not rule.rightIndicator:
                        raise ValueError(f"Strategy '{strategy.name}' {rule_type} rule {i+1} useRightIndicator is True but rightIndicator is missing")
                    if rule.rightIndicator.type == 'simple':
                        if not rule.rightIndicator.name:
                            raise ValueError(f"Strategy '{strategy.name}' {rule_type} rule {i+1} right indicator missing name")
                        # Ensure params exist
                        if not hasattr(rule.rightIndicator, 'params'):
                            rule.rightIndicator.params = {}
                    elif rule.rightIndicator.type == 'composite' and not rule.rightIndicator.expression:
                        raise ValueError(f"Strategy '{strategy.name}' {rule_type} rule {i+1} composite right indicator missing expression")
                else:
                    # If useRightIndicator is False, we must have a rightValue
                    if not rule.rightValue and rule.rightValue != '0':
                        raise ValueError(f"Strategy '{strategy.name}' {rule_type} rule {i+1} requires either a right indicator or a value")

    def _create_strategy_instance(self, 
                                strategy: StrategyInput, 
                                entry_rules: str, 
                                exit_rules: str, 
                                position_params: dict) -> Strategy:
        """Creates a Strategy instance with the specified parameters."""
        return Strategy(
            name=strategy.name,
            entry_rules=entry_rules,
            exit_rules=exit_rules,
            position_type=strategy.positionType,
            active=strategy.active,
            regime_filter=strategy.regime_filter,
            position_size_method=strategy.position_size_method,
            fixed_position_size=position_params['fixed_position_size'],
            volatility_target=position_params['volatility_target'],
            volatility_lookback=strategy.volatility_lookback,
            volatility_buffer=strategy.volatility_buffer,
            max_leverage=strategy.max_leverage,
            frequency=strategy.frequency,
        )

    def _initialize_position_parameters(self, strategy: StrategyInput) -> dict:
        """Initializes position sizing parameters."""
        if strategy.position_size_method == 'fixed':
            if strategy.fixed_position_size is None:
                raise ValueError(f"Strategy '{strategy.name}' requires fixed_position_size when using fixed position sizing")
            return {
                'fixed_position_size': strategy.fixed_position_size * strategy.allocation / 100,
                'volatility_target': None
            }
        elif strategy.position_size_method == 'volatility_target':
            if strategy.volatility_target is None:
                raise ValueError(f"Strategy '{strategy.name}' requires volatility_target when using volatility targeting")
            return {
                'fixed_position_size': None,
                'volatility_target': strategy.volatility_target * strategy.allocation / 100
            }
        else:
            raise ValueError(f"Strategy '{strategy.name}' has unknown position_size_method: {strategy.position_size_method}")