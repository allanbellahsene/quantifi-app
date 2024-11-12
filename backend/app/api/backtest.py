from fastapi import HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Any, Union
from app.services.backtest.run_backtest import run_backtest, Strategy
from app.services.backtest.metrics import metrics_table, rolling_sharpe_ratio
from app.services.backtest.trade_analysis import analyze_all_trades
import traceback
from app.utils.utils import numpy_to_python, nan_to_null
import json
from app.utils.data_fetcher import download_yf_data, fetch_binance_data
import numpy as np
import time
import pandas as pd
import re

# Define the data models first
class IndicatorInput(BaseModel):
    type: str  # 'simple' or 'composite'
    name: Optional[str] = None
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    expression: Optional[str] = None

    @validator('params')
    def validate_params(cls, v):
        return v or {}

class RuleInput(BaseModel):
    leftIndicator: IndicatorInput
    operator: str
    useRightIndicator: bool = True
    rightIndicator: Optional[IndicatorInput] = None
    rightValue: Optional[str] = None
    logicalOperator: str = "and"

    @validator('rightIndicator', 'rightValue')
    def validate_right_side(cls, v, values):
        if 'useRightIndicator' in values:
            if values['useRightIndicator'] and not v and isinstance(v, type(None)):
                raise ValueError("Right indicator must be provided when useRightIndicator is True")
            elif not values['useRightIndicator'] and isinstance(v, IndicatorInput):
                return None
        return v

class StrategyInput(BaseModel):
    name: str
    allocation: float
    positionType: str
    entryRules: List[RuleInput]
    exitRules: List[RuleInput]
    active: bool = True
    regime_filter: Optional[str] = None
    position_size_method: str = 'fixed'
    fixed_position_size: Optional[float] = None    
    volatility_target: Optional[float] = None       
    volatility_lookback: Optional[int] = 30      
    volatility_buffer: Optional[float] = None       
    max_leverage: float = 1.0
    frequency: str

    @validator('fixed_position_size', always=True)
    def validate_fixed_position_size(cls, v, values):
        if values.get('position_size_method') == 'fixed' and v is None:
            raise ValueError('fixed_position_size must be provided when position_size_method is "fixed"')
        return v

    @validator('volatility_target', always=True)
    def validate_volatility_target(cls, v, values):
        if values.get('position_size_method') == 'volatility_target' and v is None:
            raise ValueError('volatility_target must be provided when position_size_method is "volatility_target"')
        return v

class BacktestInput(BaseModel):
    symbol: str
    data_source: str
    start: str
    end: str
    fees: float
    slippage: float
    strategies: List[StrategyInput]

# Helper functions
def construct_indicator_string(indicator: IndicatorInput) -> str:
    try:
        if not indicator:
            raise ValueError("Indicator cannot be None")

        if indicator.type == 'simple':
            # For simple indicators
            if not indicator.name:
                raise ValueError("Simple indicator must have a name")
            
            params = []
            if indicator.params:
                for param_name in indicator.params:
                    param_value = indicator.params[param_name]
                    if param_name == 'series' and not param_value:
                        param_value = 'Close'
                    params.append(str(param_value))
            
            # Handle base indicators that don't need parameters
            if indicator.name in ['Open', 'High', 'Low', 'Close', 'Volume', 'BTC-USD']:
                return f"{indicator.name}()"
            else:
                return f"{indicator.name}({','.join(params)})" if params else f"{indicator.name}()"

        elif indicator.type == 'composite':
            # For composite indicators
            expression = indicator.expression
            if not expression:
                raise ValueError("Composite indicator must have an expression")
            return expression  # Return the expression directly
        else:
            raise ValueError(f"Unknown indicator type: {indicator.type}")
            
    except Exception as e:
        print(f"Error in construct_indicator_string: {str(e)}")
        print(f"Indicator data: {indicator}")
        raise

def construct_rule_string(rules: List[RuleInput]) -> str:
    try:
        rule_strings = []
        for index, r in enumerate(rules):
            if not r.leftIndicator:
                raise ValueError(f"Rule {index + 1} is missing left indicator")
            
            # Construct left side
            left = construct_indicator_string(r.leftIndicator)
            
            # Construct right side
            if r.useRightIndicator:
                if not r.rightIndicator:
                    raise ValueError(f"Rule {index + 1} is set to use right indicator but no indicator is provided")
                right = construct_indicator_string(r.rightIndicator)
            else:
                if not r.rightValue and r.rightValue != '0':
                    raise ValueError(f"Rule {index + 1} needs either a right indicator or a value")
                right = r.rightValue
            
            # Construct rule string
            rule_str = f"{left} {r.operator} {right}"
            
            # Add logical operator for all rules except the first one
            if index > 0:
                rule_str = f"{r.logicalOperator} {rule_str}"
            
            rule_strings.append(rule_str)
            
        return " ".join(rule_strings)
    except Exception as e:
        print(f"Error in construct_rule_string: {str(e)}")
        print(f"Rules data: {rules}")
        raise


async def backtest(input: BacktestInput):
    try:
        print(f"Received backtest input: {input}")
        total_start_time = time.time()

        # Collect unique frequencies from the strategies
        frequencies = set(s.frequency for s in input.strategies)

        # Fetch data for each unique frequency
        data_dict = {}
        for freq in frequencies:
            if input.data_source == 'Yahoo Finance':
                if freq != 'Daily':
                    raise ValueError(f'Yahoo Finance only supports Daily frequency, but {freq} was requested.')
                print('DOWNLOAD YF DATA:')
                data_start_time = time.time()
                df = download_yf_data(input.symbol, input.start, input.end)
                data_end_time = time.time()
                print(f"Yahoo Data downloaded  (Time taken: {data_end_time - data_start_time:.4f} seconds)")
                print('DF:')
                print(df.head())
            elif input.data_source == 'Binance':
                interval_map = {
                    'Daily': '1d',
                    '4h': '4h',
                    '1h': '1h',
                    '30m': '30m',
                    '15m': '15m',
                    '10m': '10m',
                    '5m': '5m',
                    '1m': '1m',
                }
                interval = interval_map.get(freq)
                if interval is None:
                    raise ValueError(f'Invalid frequency {freq} for Binance data source.')
                data_start_time = time.time()
                df = fetch_binance_data(input.symbol, input.start, input.end, interval=interval)
                data_end_time = time.time()
                print(f"Binance Data downloaded  (Time taken: {data_end_time - data_start_time:.4f} seconds)")
            else:
                raise ValueError(f'Data source can only be "Yahoo Finance" or "Binance"')
            data_dict[freq] = df

        print('Data stats:')
        print(df.head())
        print(df.columns)
        print(df.shape)
        print(type(df))

        print(f"Received strategies: {input.strategies}")

        strategies_results = []
        strategies_info = []
        strategies_df_results = []  # Store per-strategy DataFrames before resampling
        
        # Process each strategy
        for s in input.strategies:
            print(f"Processing strategy: {s.name}")
            try:
                df = data_dict[s.frequency].copy()
                rule_start_time = time.time()

                # Validate strategy rules before processing
                for rule_type, rules in [("entry", s.entryRules), ("exit", s.exitRules)]:
                    for i, rule in enumerate(rules):
                        if not rule.leftIndicator:
                            raise ValueError(f"Strategy '{s.name}' {rule_type} rule {i+1} is missing left indicator")
                        if rule.useRightIndicator and not rule.rightIndicator:
                            raise ValueError(f"Strategy '{s.name}' {rule_type} rule {i+1} requires right indicator but none provided")
                        if not rule.useRightIndicator and not rule.rightValue and rule.rightValue != '0':
                            raise ValueError(f"Strategy '{s.name}' {rule_type} rule {i+1} requires a value but none provided")

                # Construct rule strings
                entry_rule_str = construct_rule_string(s.entryRules)
                exit_rule_str = construct_rule_string(s.exitRules)
                rule_end_time = time.time()
                print(f"Rule Parsing (Time taken: {rule_end_time - rule_start_time:.4f} seconds)")

                print(f"Entry rules: {entry_rule_str}")
                print(f"Exit rules: {exit_rule_str}")

                # Initialize position sizing parameters
                if s.position_size_method == 'fixed':
                    if s.fixed_position_size is None:
                        raise ValueError(f"Strategy '{s.name}' requires fixed_position_size when using fixed position sizing")
                    fixed_position_size = s.fixed_position_size * s.allocation / 100
                    volatility_target = None
                elif s.position_size_method == 'volatility_target':
                    if s.volatility_target is None:
                        raise ValueError(f"Strategy '{s.name}' requires volatility_target when using volatility targeting")
                    fixed_position_size = None
                    volatility_target = s.volatility_target * s.allocation / 100
                else:
                    raise ValueError(f"Strategy '{s.name}' has unknown position_size_method: {s.position_size_method}")

                strategy_start_time = time.time()
                strategy = Strategy(
                    name=s.name,
                    entry_rules=entry_rule_str,
                    exit_rules=exit_rule_str,
                    position_type=s.positionType,
                    active=s.active,
                    regime_filter=s.regime_filter,
                    position_size_method=s.position_size_method,
                    fixed_position_size=fixed_position_size,
                    volatility_target=volatility_target,
                    volatility_lookback=s.volatility_lookback,
                    volatility_buffer=s.volatility_buffer,
                    max_leverage=s.max_leverage,
                    frequency=s.frequency,
                )
                strategy_end_time = time.time()
                print(f"Strategy Definition (Time taken: {strategy_end_time - strategy_start_time:.4f} seconds)")

                # Run backtest for this strategy
                df_result = run_backtest(df, strategy, input.fees, input.slippage)

                # Store individual strategy results
                strategies_results.append(df_result)
                strategies_df_results.append(df_result.copy())
                strategies_info.append(strategy)
                print(f"Strategy {s.name} backtested successfully")
            except Exception as e:
                print(f"Error backtesting strategy {s.name}: {str(e)}")
                print(traceback.format_exc())
                raise HTTPException(status_code=400, detail=f"Error in strategy {s.name}: {str(e)}")

        # Combine strategy results
        print("Combining strategy results")
        comb_start_time = time.time()
        combined_df = None
        for idx, df_result in enumerate(strategies_results):
            strategy = strategies_info[idx]
            # Resample to daily frequency with appropriate aggregation
            agg_dict = {
                f'{strategy.name}_returns': lambda x: (x + 1).prod() - 1,
                f'{strategy.name}_log_returns': 'sum',
                f'{strategy.name}_position': 'last',
                f'{strategy.name}_signal': 'last',
                f'{strategy.name}_cumulative_equity': 'last',
                f'{strategy.name}_cumulative_log_equity': 'last',
                f'{strategy.name}_drawdown': 'last',
                f'{strategy.name}_rolling_sharpe': 'last',
                'Close': 'last',
            }

            # Ensure that the columns exist in df_result before aggregating
            agg_dict = {k: v for k, v in agg_dict.items() if k in df_result.columns}
            
            df_resampled = df_result.resample('D').agg(agg_dict)

            if combined_df is None:
                combined_df = df_resampled[['Close']].copy()
                combined_df['portfolio_returns'] = df_resampled[f'{strategy.name}_returns'].fillna(0)
                combined_df['portfolio_log_returns'] = df_resampled[f'{strategy.name}_log_returns'].fillna(0)
                combined_df['total_position'] = df_resampled[f'{strategy.name}_position'].fillna(0)
            else:
                combined_df['portfolio_returns'] += df_resampled[f'{strategy.name}_returns'].fillna(0)
                combined_df['portfolio_log_returns'] += df_resampled[f'{strategy.name}_log_returns'].fillna(0)
                combined_df['total_position'] += df_resampled[f'{strategy.name}_position'].fillna(0)

            # Add strategy-specific columns to combined_df
            for col in ['cumulative_equity', 'cumulative_log_equity', 'returns', 'position', 'drawdown', 'rolling_sharpe', 'signal']:
                combined_df[f'{strategy.name}_{col}'] = df_resampled[f'{strategy.name}_{col}']

        # Calculate overall portfolio metrics
        combined_df['cumulative_equity'] = (1 + combined_df['portfolio_returns']).cumprod()
        combined_df['cumulative_log_equity'] = combined_df['portfolio_log_returns'].cumsum()
        combined_df['returns'] = combined_df['Close'].pct_change()
        combined_df['log_returns'] = np.log(combined_df['Close'] / combined_df['Close'].shift())
        combined_df['cumulative_market_equity'] = (1 + combined_df['returns']).cumprod()
        combined_df['cumulative_log_market_equity'] = combined_df['log_returns'].cumsum()
        combined_df['cumulative_market_returns'] = combined_df['cumulative_market_equity'] - 1

        # Calculate drawdowns
        combined_df['portfolio_drawdown'] = 1 - combined_df['cumulative_equity'] / combined_df['cumulative_equity'].cummax()
        combined_df['market_drawdown'] = 1 - combined_df['cumulative_market_equity'] / combined_df['cumulative_market_equity'].cummax()

        # Calculate rolling Sharpe ratios
        window = 90
        combined_df['portfolio_rolling_sharpe'] = rolling_sharpe_ratio(combined_df['portfolio_returns'], window)
        combined_df['market_rolling_sharpe'] = rolling_sharpe_ratio(combined_df['returns'], window)

        comb_end_time = time.time()
        print(f"Combination (Time taken: {comb_end_time - comb_start_time:.4f} seconds)")

        # Prepare metrics and results
        result = metrics_table(combined_df, strategies_info)
        result = json.loads(json.dumps(result, default=numpy_to_python))

        # Analyze trades using per-strategy DataFrames before resampling
        trades_df = analyze_all_trades(strategies_df_results, strategies_info).fillna(0)
        trades_list = trades_df.to_dict('records')
        result['trades'] = trades_list

        # Convert NaN values to None (null in JSON)
        result = nan_to_null(result)

        total_end_time = time.time()
        print(f"Complete backtest completed in {total_end_time - total_start_time:.4f} seconds")

        return result

    except Exception as e:
        print(f"Error in backtest function: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))




