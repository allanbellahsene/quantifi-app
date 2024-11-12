# app/api/backtest.py
from fastapi import HTTPException
import logging
import time
import traceback
import json
from typing import Dict

from app.models.backtest import BacktestInput
from app.services.data.data_service import DataService
from app.services.strategy_service.strategy import StrategyService
from app.services.backtest.metrics_calculator import PortfolioMetricsCalculator
from app.services.backtest.trade_analysis import analyze_all_trades
from app.utils.utils import numpy_to_python, nan_to_null

logger = logging.getLogger(__name__)

async def backtest(input: BacktestInput):
    """
    Main coordinator function for the backtesting process.
    Orchestrates data fetching, strategy processing, and results calculation.
    """
    try:
        logger.info(f"Starting backtest for symbol: {input.symbol}")
        total_start_time = time.time()

        # 1. Fetch required data
        data_dict = await DataService.fetch_data(
            symbol=input.symbol,
            start=input.start,
            end=input.end,
            data_source=input.data_source,
            strategies=input.strategies
        )

        # 2. Process strategies
        strategy_service = StrategyService(input.strategies, input.fees, input.slippage)
        strategies_results, strategies_info, strategies_df_results = await strategy_service.process_strategies(data_dict)

        # 3. Combine results and calculate portfolio metrics
        combined_df = await _combine_strategy_results(strategies_results, strategies_info)
        
        # 4. Calculate portfolio metrics
        metrics_calculator = PortfolioMetricsCalculator(combined_df, strategies_info)
        combined_df = metrics_calculator.calculate_all_metrics()

        # 5. Prepare final results
        result = await _prepare_final_results(
            combined_df=combined_df,
            strategies_info=strategies_info,
            strategies_df_results=strategies_df_results
        )

        total_time = time.time() - total_start_time
        logger.info(f"Backtest completed in {total_time:.2f} seconds")
        
        return result

    except Exception as e:
        logger.error(f"Error in backtest: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))

async def _combine_strategy_results(strategies_results: list, strategies_info: list) -> Dict:
    """
    Combines results from multiple strategies into a single DataFrame.
    """
    try:
        combined_df = None
        
        for idx, df_result in enumerate(strategies_results):
            strategy = strategies_info[idx]
            
            # Define aggregation rules
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

            # Filter for existing columns
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

            # Add strategy-specific columns
            strategy_columns = ['cumulative_equity', 'cumulative_log_equity', 'returns', 
                              'position', 'drawdown', 'rolling_sharpe', 'signal']
            for col in strategy_columns:
                combined_df[f'{strategy.name}_{col}'] = df_resampled[f'{strategy.name}_{col}']

        return combined_df

    except Exception as e:
        logger.error(f"Error combining strategy results: {str(e)}")
        raise

async def _prepare_final_results(combined_df, strategies_info, strategies_df_results):
    """
    Prepares the final results including metrics and trade analysis.
    """
    try:
        from app.services.backtest.metrics import metrics_table
        
        # Calculate metrics
        result = metrics_table(combined_df, strategies_info)
        result = json.loads(json.dumps(result, default=numpy_to_python))

        # Analyze trades
        trades_df = analyze_all_trades(strategies_df_results, strategies_info).fillna(0)
        result['trades'] = trades_df.to_dict('records')

        # Convert NaN values to None for JSON compatibility
        result = nan_to_null(result)

        return result

    except Exception as e:
        logger.error(f"Error preparing final results: {str(e)}")
        raise



