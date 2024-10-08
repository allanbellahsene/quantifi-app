#app.services.backtest_new.py

import pandas as pd
import numpy as np
from app.utils.utils import numpy_to_python
from typing import List, Dict
from app.services.backtest.strategies import Strategy, add_indicators


def run_backtest(df: pd.DataFrame, strategies: List[Strategy], fees: float, slippage: float) -> pd.DataFrame:
    """Run a backtest for the given strategies"""
    print("Starting backtest...")

    # Add indicators to the DataFrame
    df = add_indicators(df, strategies)
    print("Indicators added to DataFrame")

    # Generate signals and calculate returns for each strategy
    for strategy in strategies:
        if strategy.active:
            print(f"Generating signals for strategy: {strategy.name}")
            df[f'{strategy.name}_signal'] = strategy.generate_signals(df)
            df[f'{strategy.name}_returns'] = df[f'{strategy.name}_signal'].shift() * df['Close'].pct_change() - \
                                             df[f'{strategy.name}_signal'].diff().abs() * (fees + slippage)
            df[f'{strategy.name}_cumulative_equity'] = (1 + df[f'{strategy.name}_returns']).cumprod()
            df[f'{strategy.name}_cumulative_returns'] = df[f'{strategy.name}_cumulative_equity'] - 1

    # Combine signals from all active strategies
    df['position'] = sum(
        df[f'{strategy.name}_signal'] * strategy.position_size * strategy.active
        for strategy in strategies
    )
    print("Combined signals from all active strategies")

    # Calculate overall portfolio returns
    df['returns'] = df['Close'].pct_change()
    df['gross_strategy_returns'] = df['position'].shift() * df['returns']

    # Apply fees and slippage
    df['trades'] = df['position'].diff().abs()
    df['transaction_costs'] = df['trades'] * (fees + slippage)
    df['strategy_returns'] = df['gross_strategy_returns'] - df['transaction_costs']
    print("Calculated returns and applied fees and slippage")

    # Calculate cumulative returns
    df['cumulative_equity'] = (1 + df['strategy_returns']).cumprod()
    df['cumulative_market_equity'] = (1 + df['returns']).cumprod()
    df['cumulative_returns'] = df['cumulative_equity'] - 1
    df['cumulative_market_returns'] = df['cumulative_market_equity'] - 1
    print("Calculated cumulative returns")

    # Calculate drawdowns
    df['strategy_drawdown'] = 1 - df['cumulative_equity'] / df['cumulative_equity'].cummax()
    df['market_drawdown'] = 1 - df['cumulative_market_equity'] / df['cumulative_market_equity'].cummax()
    print("Calculated drawdowns")

    print("Backtest completed")

    return df



def calculate_metrics(returns: pd.Series, positions: pd.Series, initial_value: float = 10000) -> Dict[str, float]:
    """Calculate a comprehensive set of performance metrics."""
    cum_returns = (1 + returns).cumprod()
    total_return = cum_returns.iloc[-1] - 1
    annualized_return = (1 + total_return) ** (365 / len(returns)) - 1
    
    volatility = returns.std() * np.sqrt(365)
    sharpe_ratio = annualized_return / volatility if volatility != 0 else 0

    drawdowns =  1 - cum_returns.div(cum_returns.cummax())
    max_drawdown = drawdowns.max()
    avg_drawdown = drawdowns.mean()
    
    positive_returns = returns[returns > 0]
    negative_returns = returns[returns < 0]
    
    win_rate = len(positive_returns) / len(returns)
    loss_rate = len(negative_returns) / len(returns)
    avg_win = positive_returns.mean() if len(positive_returns) > 0 else 0
    avg_loss = negative_returns.mean() if len(negative_returns) > 0 else 0
    profit_factor = abs(positive_returns.sum() / negative_returns.sum()) if negative_returns.sum() != 0 else np.inf

    sortino_ratio = annualized_return / (np.sqrt(365) * negative_returns.std()) if len(negative_returns) > 0 else np.inf
    
    calmar_ratio = annualized_return / max_drawdown if max_drawdown != 0 else np.inf

    #returns.index = pd.to_datetime(returns.index)
    
    try:
        monthly_returns = returns.resample('M').apply(lambda x: (x + 1).prod() - 1)
        best_month = monthly_returns.max()
        worst_month = monthly_returns.min()
    except Exception as e:
        print(f'Error calculating monthly returns: {e}')
        best_month = None
        worst_month = None

    # New metrics
    start_date = returns.index[0]
    end_date = returns.index[-1]
    end_value = initial_value * (1 + total_return)
    max_value = initial_value * cum_returns.max()
    min_value = initial_value * cum_returns.min()
    
    trades = positions.diff().abs()
    nb_trades = trades[trades != 0].count()
    
    exposure = (positions != 0).mean()
    
    # Additional metrics for systematic traders
    max_consecutive_wins = (returns > 0).groupby((returns <= 0).cumsum()).cumsum().max()
    max_consecutive_losses = (returns < 0).groupby((returns >= 0).cumsum()).cumsum().max()
    
    avg_trade_duration = positions.groupby((positions != positions.shift()).cumsum()).size().mean()

    metrics = {
        "Start Date": None,
        "End Date": None,
        "Initial Value": initial_value,
        "End Value": None,
        "Max Value": None,
        "Min Value": None,
        "Total Return": None,
        "Annualized Return": None,
        "Volatility": None,
        "Sharpe Ratio": None,
        "Max Drawdown": None,
        "Average Drawdown": None,
        "Win Rate": None,
        "Loss Rate": None,
        "Average Win": None,
        "Average Loss": None,
        "Profit Factor": None,
        "Sortino Ratio": None,
        "Calmar Ratio": None,
        "Best Month": None,
        "Worst Month": None,
        "Number of Trades": None,
        "Exposure (%)": None,
        "Max Consecutive Wins": None,
        "Max Consecutive Losses": None,
        "Average Trade Duration (days)": None
    }

    try:
        metrics = {
            "Start Date": start_date,
            "End Date": end_date,
            "Initial Value": initial_value,
            "End Value": end_value,
            "Max Value": max_value,
            "Min Value": min_value,
            "Total Return": total_return,
            "Annualized Return": annualized_return,
            "Volatility": volatility,
            "Sharpe Ratio": sharpe_ratio,
            "Max Drawdown": max_drawdown,
            "Average Drawdown": avg_drawdown,
            "Win Rate": win_rate,
            "Loss Rate": loss_rate,
            "Average Win": avg_win,
            "Average Loss": avg_loss,
            "Profit Factor": profit_factor,
            "Sortino Ratio": sortino_ratio,
            "Calmar Ratio": calmar_ratio,
            "Number of Trades": nb_trades,
            "Exposure (%)": exposure * 100,
            "Max Consecutive Wins": max_consecutive_wins,
            "Max Consecutive Losses": max_consecutive_losses,
            "Average Trade Duration (days)": avg_trade_duration
        }

    except Exception as e:
        print(f"Error calculating metrics: {str(e)}")

    return {k: numpy_to_python(v) for k, v in metrics.items()}
