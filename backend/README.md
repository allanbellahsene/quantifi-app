# QuantiFi Backend

A FastAPI-based backtesting engine for quantitative trading strategies. Handles strategy evaluation, portfolio management, and performance analysis.

## Architecture Overview



## Components

### API Layer (`/api`)
- `backtest.py`: Main endpoint handling backtest requests
  - Orchestrates data flow between services
  - Handles request validation and error handling

### Models (`/models`)
- `backtest.py`: Data models using Pydantic
  - `BacktestInput`: Main backtest request schema
  - `StrategyInput`: Strategy configuration model
  - `RuleInput`: Trading rule definitions
  - `IndicatorInput`: Technical indicator configurations

### Services

#### Data Service (`/services/data`)
- `data_service.py`: Data management
  - Fetches market data
  - Handles data preprocessing
- `data_fetcher.py`: Raw data retrieval from various sources

#### Strategy Service (`/services/strategy_module`)
- `strategy.py`: Core strategy implementation
  - Position sizing logic
  - Signal generation coordination
- `expressions.py`: Rule parsing and evaluation
- `indicators.py`: Technical indicator calculations
- `signals.py`: Trading signal generation
- `rule_parser.py`: Trading rule parsing

#### Backtest Service (`/services/backtest`)
- `run_backtest.py`: Core backtesting engine
- `metrics_calculator.py`: Performance metrics computation
- `metrics.py`: Financial metrics calculations
- `trade_analysis.py`: Trade-by-trade analysis

## Setup

### Requirements
```
python >= 3.12
fastapi
pandas
numpy
```

### Installation
```bash
git clone <repository>
cd quantifi-backend
pip install -r requirements.txt
```

### Running
```bash
uvicorn main:app --reload --port 8001
```

## API Usage

### Backtest Endpoint
`POST /api/backtest`

Request body:
```json
{
  "symbol": "string",
  "data_source": "string",
  "start": "YYYY-MM-DD",
  "end": "YYYY-MM-DD",
  "fees": float,
  "slippage": float,
  "strategies": [
    {
      "name": "string",
      "entry_rules": "string",
      "exit_rules": "string",
      "position_type": "long|short",
      "position_size_method": "fixed|volatility_target",
      "volatility_target": float,
      "max_leverage": float
    }
  ]
}
```

Response:
```json
{
  "equityCurve": [...],
  "drawdown": [...],
  "rollingSharpe": [...],
  "metrics": {
    "Portfolio": {...},
    "Benchmark": {...},
    "Strategy": {...}
  },
  "trades": [...]
}
```

## Features

### Strategy Definition
- Complex trading rules using technical indicators
- Multiple position sizing methods
- Regime filters
- Risk management parameters

### Performance Analysis
- Equity curves
- Drawdown analysis
- Risk metrics (Sharpe, Sortino, Calmar ratios)
- Trade statistics
- Rolling metrics

### Risk Management
- Position sizing methods:
  - Fixed sizing
  - Volatility targeting
- Maximum leverage limits
- Slippage and fee modeling

## Development

### Adding New Features

1. Strategy Implementation
```python
# services/strategy_module/strategy.py
class Strategy:
    def __init__(self, name, rules, ...):
        pass
```

2. Indicator Implementation
```python
# services/strategy_module/indicators.py
def new_indicator(series: pd.Series, window: int) -> pd.Series:
    pass
```

### Testing
```bash
pytest tests/
```

Test files location: `/test/`
- Unit tests for strategies
- Integration tests for backtest engine
- Sample data for testing


## Authentication

### Test

There are three differents things to test:

1. Registering & Login by username, email and password
2. Registering & Login by Gmail
3. Access protected routes if login

To test the authentication procedure, there are two ways.
First via the *curl* command and second via a *React App*.

1. To use it via the curl command, go to the *test* repository
```
cd test
./test_protected.sh
```
2. For the test via React App, go to *test/auth-app*
```
cd test/auth-app
npm start
```

## Migration

The migration of the database as to be made, every time a SQL model has been added or modified.

At the root of the backend project, use the following command:
'''
alembic revision --autogenerate -m "Migration message"
alembic upgrade head
'''

If something goes wrong you can rollback:
'''
alembic downgrade -1
'''