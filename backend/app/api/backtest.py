#app.api.backtest.py
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.backtest.run_backtest import run_backtest, Strategy
from app.services.backtest.metrics import metrics_table
import traceback
from app.utils.utils import numpy_to_python, nan_to_null
import json
from app.utils.data_fetcher import download_yf_data, fetch_binance_data
from pydantic import validator
from app.services.backtest.trade_analysis import analyze_all_trades
import numpy as np
import time

class RuleInput(BaseModel):
    leftIndicator: str
    leftParams: Dict[str, str]
    operator: str
    useRightIndicator: bool = True
    rightIndicator: str = ""
    rightParams: Dict[str, str] = {}
    rightValue: Optional[str] = None
    logicalOperator: str = "and"

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

        
        strategy_iter_start_time = time.time()

        strategies_results = []
        strategies_info = []
        strategies_df_results = []  # Store per-strategy DataFrames before resampling
        for s in input.strategies:
            print(f"Processing strategy: {s.name}")
            try:
                df = data_dict[s.frequency].copy()
                rule_start_time = time.time()
                entry_rule_str = construct_rule_string(s.entryRules)
                exit_rule_str = construct_rule_string(s.exitRules)
                rule_end_time = time.time()
                print(f"Rule Parsing (Time taken: {rule_end_time - rule_start_time:.4f} seconds)")

                print(f"Entry rules: {entry_rule_str}")
                print(f"Exit rules: {exit_rule_str}")

                # Initialize variables
                fixed_position_size = None
                volatility_target = None

                # Handle position sizing based on the method
                if s.position_size_method == 'fixed':
                    if s.fixed_position_size is None:
                        raise ValueError('fixed_position_size must be provided when position_size_method is "fixed"')
                    fixed_position_size = s.fixed_position_size * s.allocation / 100
                elif s.position_size_method == 'volatility_target':
                    if s.volatility_target is None:
                        raise ValueError('volatility_target must be provided when position_size_method is "volatility_target"')
                    # Apply allocation to volatility_target
                    volatility_target = s.volatility_target * s.allocation / 100
                else:
                    raise ValueError(f"Unknown position_size_method: {s.position_size_method}")

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
                # Add other columns as needed
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
            combined_df[f'{strategy.name}_cumulative_equity'] = df_resampled[f'{strategy.name}_cumulative_equity']
            combined_df[f'{strategy.name}_cumulative_log_equity'] = df_resampled[f'{strategy.name}_cumulative_log_equity']  # Ensure this column is added
            combined_df[f'{strategy.name}_returns'] = df_resampled[f'{strategy.name}_returns']
            combined_df[f'{strategy.name}_position'] = df_resampled[f'{strategy.name}_position']
            combined_df[f'{strategy.name}_drawdown'] = df_resampled[f'{strategy.name}_drawdown']
            combined_df[f'{strategy.name}_rolling_sharpe'] = df_resampled[f'{strategy.name}_rolling_sharpe']
            combined_df[f'{strategy.name}_signal'] = df_resampled[f'{strategy.name}_signal']  # Add this line

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
        combined_df['portfolio_rolling_sharpe'] = combined_df['portfolio_returns'].rolling(window).apply(
            lambda x: (x.mean() / x.std()) * np.sqrt(365) if x.std() != 0 else 0)
        combined_df['market_rolling_sharpe'] = combined_df['returns'].rolling(window).apply(
            lambda x: (x.mean() / x.std()) * np.sqrt(365) if x.std() != 0 else 0)

        # Prepare metrics and results
        result = metrics_table(combined_df, strategies_info)

        # Convert result to JSON-friendly format
        result = json.loads(json.dumps(result, default=numpy_to_python))

        # Analyze trades using per-strategy DataFrames before resampling
        trades_df = analyze_all_trades(strategies_df_results, strategies_info).fillna(0)
        trades_list = trades_df.to_dict('records')
        result['trades'] = trades_list

        # Convert NaN values to None (null in JSON)
        result = nan_to_null(result)

        total_end_time = time.time()
        print(f"Backtest for strategy {strategy.name} completed in {total_end_time - total_start_time:.4f} seconds.")

        return result

    except Exception as e:
        print(f"Error in backtest function: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))





def construct_rule_string(rules: List[RuleInput]) -> str:
    try:
        rule_strings = []
        for index, r in enumerate(rules):
            # Filter out empty parameter values
            left_params = [v for v in r.leftParams.values() if v]
            left = f"{r.leftIndicator}({','.join(left_params)})" if left_params else r.leftIndicator
            
            if r.useRightIndicator:
                right_params = [v for v in r.rightParams.values() if v]
                right = f"{r.rightIndicator}({','.join(right_params)})" if right_params else r.rightIndicator
            else:
                right = r.rightValue if r.rightValue is not None else ""
            
            rule_str = f"{left} {r.operator} {right}"
            if index > 0:
                rule_str = f"{r.logicalOperator} {rule_str}"
            rule_strings.append(rule_str)
        return " ".join(rule_strings)
    except Exception as e:
        print(f"Error in construct_rule_string: {str(e)}")
        print(traceback.format_exc())
        raise



