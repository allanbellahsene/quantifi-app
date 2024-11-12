import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.utils.utils import numpy_to_python


def calculate_cumulative_returns(returns: pd.Series) -> pd.Series:
    """
    Calculate cumulative returns from a series of returns.

    Args:
        returns (pd.Series): Series of periodic returns.

    Returns:
        pd.Series: Series of cumulative returns.
    """
    return (1 + returns).cumprod()

def calculate_annualized_return(total_return: float, periods_per_year: int, total_periods: int) -> float:
    """
    Calculate the annualized return based on total return.

    Args:
        total_return (float): Total return over the period.
        periods_per_year (int): Number of periods in a year (e.g., 252 for trading days).
        total_periods (int): Total number of periods in the returns series.

    Returns:
        float: Annualized return.
    """
    return (1 + total_return) ** (periods_per_year / total_periods) - 1

def calculate_volatility(returns: pd.Series, periods_per_year: int) -> float:
    """
    Calculate the annualized volatility of returns.

    Args:
        returns (pd.Series): Series of periodic returns.
        periods_per_year (int): Number of periods in a year.

    Returns:
        float: Annualized volatility.
    """
    return returns.std() * np.sqrt(periods_per_year)

def calculate_drawdowns(cumulative_returns: pd.Series) -> pd.Series:
    """
    Calculate drawdowns from cumulative returns.

    Args:
        cumulative_returns (pd.Series): Series of cumulative returns.

    Returns:
        pd.Series: Series of drawdowns.
    """
    return 1 - cumulative_returns.div(cumulative_returns.cummax())

def calculate_profit_factor(positive_returns: pd.Series, negative_returns: pd.Series) -> float:
    """
    Calculate the profit factor.

    Args:
        positive_returns (pd.Series): Series of positive returns.
        negative_returns (pd.Series): Series of negative returns.

    Returns:
        float: Profit factor.
    """
    total_positive = positive_returns.sum()
    total_negative = negative_returns.sum()
    return abs(total_positive / total_negative) if total_negative != 0 else np.inf

def calculate_sortino_ratio(annualized_return: float, negative_returns: pd.Series, periods_per_year: int) -> float:
    """
    Calculate the Sortino ratio.

    Args:
        annualized_return (float): Annualized return.
        negative_returns (pd.Series): Series of negative returns.
        periods_per_year (int): Number of periods in a year.

    Returns:
        float: Sortino ratio.
    """
    downside_std = negative_returns.std() * np.sqrt(periods_per_year)
    return annualized_return / downside_std if downside_std != 0 else np.inf

def calculate_calmar_ratio(annualized_return: float, max_drawdown: float) -> float:
    """
    Calculate the Calmar ratio.

    Args:
        annualized_return (float): Annualized return.
        max_drawdown (float): Maximum drawdown.

    Returns:
        float: Calmar ratio.
    """
    return annualized_return / max_drawdown if max_drawdown != 0 else np.inf

def calculate_best_worst_month(returns: pd.Series) -> (float, float):
    """
    Calculate the best and worst monthly returns.

    Args:
        returns (pd.Series): Series of periodic returns.

    Returns:
        tuple: Best month return, Worst month return.
    """
    try:
        monthly_returns = (returns + 1).resample('ME').prod() - 1
        best_month = monthly_returns.max()
        worst_month = monthly_returns.min()
    except Exception as e:
        print(f'Error calculating monthly returns: {e}')
        best_month = None
        worst_month = None
    return best_month, worst_month

def rolling_sharpe_ratio(returns: pd.Series, window: int, periods_per_year: int = 365) -> pd.Series:
    rolling_mean = returns.rolling(window).mean()
    rolling_std = returns.rolling(window).std()
    sharpe_ratio = (rolling_mean / rolling_std) * np.sqrt(periods_per_year)
    sharpe_ratio[rolling_std == 0] = 0  # Handle division by zero
    return sharpe_ratio

def calculate_metrics(
    returns: pd.Series,
    positions: pd.Series,
    initial_value: float = 10000,
    periods_per_year: int = 365
) -> Dict[str, Any]:
    """
    Calculate a comprehensive set of performance metrics.

    Args:
        returns (pd.Series): Series of periodic returns.
        positions (pd.Series): Series indicating positions held (e.g., 0 or 1).
        initial_value (float): Initial portfolio value.
        periods_per_year (int): Number of periods in a year.

    Returns:
        Dict[str, Any]: Dictionary of calculated metrics.
    """
    # Calculate cumulative returns
    cum_returns = calculate_cumulative_returns(returns)
    total_return = cum_returns.iloc[-1] - 1
    annualized_return = calculate_annualized_return(total_return, periods_per_year, len(returns))

    # Calculate volatility and Sharpe ratio
    volatility = calculate_volatility(returns, periods_per_year)
    sharpe_ratio = annualized_return / volatility if volatility != 0 else 0

    # Calculate drawdowns
    drawdowns = calculate_drawdowns(cum_returns)
    max_drawdown = drawdowns.max()
    avg_drawdown = drawdowns.mean()

    # Positive and negative returns
    positive_returns = returns[returns >= 0]
    negative_returns = returns[returns < 0]

    # Win rate and loss rate
    total_trades = len(returns)
    win_rate = len(positive_returns) / total_trades if total_trades >= 0 else 0
    loss_rate = len(negative_returns) / total_trades if total_trades > 0 else 0

    # Average win and loss
    avg_win = positive_returns.mean() if not positive_returns.empty else 0
    avg_loss = negative_returns.mean() if not negative_returns.empty else 0

    # Profit factor
    profit_factor = calculate_profit_factor(positive_returns, negative_returns)

    # Sortino ratio
    sortino_ratio = calculate_sortino_ratio(annualized_return, negative_returns, periods_per_year)

    # Calmar ratio
    calmar_ratio = calculate_calmar_ratio(annualized_return, max_drawdown)

    # Best and worst month
    best_month, worst_month = calculate_best_worst_month(returns)

    # Portfolio value metrics
    start_date = returns.index[0]
    end_date = returns.index[-1]
    end_value = initial_value * cum_returns.iloc[-1]
    max_value = initial_value * cum_returns.max()
    min_value = initial_value * cum_returns.min()

    # Number of trades
    trades = positions.diff().abs()
    nb_trades = trades[trades != 0].count()

    # Exposure as a percentage
    exposure = (positions != 0).mean() * 100

    # Max consecutive wins and losses
    max_consecutive_wins = (returns > 0).astype(int).groupby((returns <= 0).cumsum()).cumsum().max()
    max_consecutive_losses = (returns < 0).astype(int).groupby((returns >= 0).cumsum()).cumsum().max()

    # Average trade duration
    trade_durations = positions.groupby((positions != positions.shift()).cumsum()).size()
    avg_trade_duration = trade_durations.mean()

    # Compile all metrics into a dictionary
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
        "Best Month": best_month,
        "Worst Month": worst_month,
        "Number of Trades": nb_trades,
        "Exposure (%)": exposure,
        "Max Consecutive Wins": max_consecutive_wins,
        "Max Consecutive Losses": max_consecutive_losses,
        "Average Trade Duration (days)": avg_trade_duration
    }

    # Convert any numpy data types to native Python types
    return {k: numpy_to_python(v) for k, v in metrics.items()}

def metrics_table(df_result: pd.DataFrame, strategies: List[Any]) -> Dict[str, Any]:
    """
    Generate a metrics table from backtest results.

    Args:
        df_result (pd.DataFrame): DataFrame containing backtest results.
        strategies (List[Any]): List of strategy objects.

    Returns:
        Dict[str, Any]: Dictionary containing equity curves, drawdowns, rolling Sharpe ratios, and metrics.
    """
    # Prepare columns for equity curves
    equity_columns = ['cumulative_log_equity', 'cumulative_log_market_equity', 'cumulative_equity',
                      'cumulative_market_equity'] + [
        f'{s.name}_cumulative_log_equity' for s in strategies if s.active
    ] + [f'{s.name}_cumulative_equity' for s in strategies if s.active]
    
    equity_curve = df_result[equity_columns].reset_index().rename(columns={'index': 'Date'}).to_dict('records')

    # Prepare columns for drawdowns
    drawdown_columns = ['portfolio_drawdown', 'market_drawdown'] + [
        f'{s.name}_drawdown' for s in strategies if s.active
    ]
    drawdown = df_result[drawdown_columns].reset_index().rename(columns={'index': 'Date'}).to_dict('records')

    # Prepare columns for rolling Sharpe ratios
    rolling_sharpe_columns = ['portfolio_rolling_sharpe', 'market_rolling_sharpe'] + [
        f'{s.name}_rolling_sharpe' for s in strategies if s.active
    ]
    rolling_sharpe = df_result[rolling_sharpe_columns].reset_index().rename(columns={'index': 'Date'}).to_dict('records')

    # Calculate metrics for the portfolio and benchmark
    metrics = {
        'Portfolio': calculate_metrics(df_result['portfolio_returns'], df_result['total_position']),
        'Benchmark': calculate_metrics(
            df_result['returns'],
            pd.Series(1, index=df_result.index)  # Benchmark assumes always invested
        )
    }

    # Calculate metrics for each active strategy
    signals = {}
    for strategy in strategies:
        if strategy.active:
            strategy_returns = df_result[f'{strategy.name}_returns']
            strategy_positions = df_result[f'{strategy.name}_signal']
            metrics[strategy.name] = calculate_metrics(strategy_returns, strategy_positions)
            signals[strategy.name] = df_result[[f'{strategy.name}_signal', 'Close']].reset_index().rename(columns={'index': 'Date'}).to_dict('records')

    # Compile the final result
    result = {
        'equityCurve': equity_curve,
        'drawdown': drawdown,
        'rollingSharpe': rolling_sharpe,
        'metrics': metrics,
        'signals': signals
    }


    return result
