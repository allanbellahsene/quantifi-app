
if __name__ == "__main__":

    import pandas as pd
    from app.services.strategy_module import Strategy
    from app.services.strategy_module.indicators import INDICATORS
    from app.services.strategy_module.utils import add_indicators

    import yfinance as yf
    df = yf.download('BTC-USD', start='2020-01-01', end='2024-01-01')
    strategy = Strategy(
        name='ExampleStrategy',
        entry_rules='SMA(20) > SMA(100)',
        exit_rules='SMA(20) < SMA(100)',
        position_type='long',
        position_size_method='fixed',
        fixed_position_size=1.0,
    )

    # Add necessary indicators
    df = add_indicators(df, [strategy])

    # Generate signals
    signals = strategy.generate_signals(df)
    df['Position'] = signals

    # Calculate position sizes
    position_sizes = strategy.calculate_position_sizes(df)
    df['PositionSize'] = position_sizes  

    print(df.head())