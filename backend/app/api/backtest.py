#app.api.backtest_new.py
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.backtest.run_backtest import run_backtest, Strategy
from app.services.backtest.metrics import metrics_table
import traceback
from app.utils.utils import numpy_to_python, nan_to_null
import json
from app.utils.data_fetcher import download_yf_data

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
    position_size: float = 1.0
    regime_filter: Optional[str] = None

class BacktestInput(BaseModel):
    symbol: str
    start: str
    end: str
    fees: float
    slippage: float
    strategies: List[StrategyInput]


async def backtest(input: BacktestInput):
    try:
        print(f"Received backtest input: {input}")
        
        df = download_yf_data(input.symbol, input.start, input.end)
        print(f"Downloaded data for {input.symbol} from {input.start} to {input.end}")
        
        strategies = []
        for s in input.strategies:
            print(f"Processing strategy: {s.name}")
            try:
                entry_rule_str = construct_rule_string(s.entryRules)
                exit_rule_str = construct_rule_string(s.exitRules)
                
                print(f"Entry rules: {entry_rule_str}")
                print(f"Exit rules: {exit_rule_str}")
                
                strategy = Strategy(
                    name=s.name,
                    entry_rules=entry_rule_str,
                    exit_rules=exit_rule_str,
                    position_type=s.positionType,
                    active=s.active,
                    position_size=s.position_size * s.allocation / 100,
                    regime_filter=s.regime_filter
                )
                strategies.append(strategy)
                print(f"Strategy {s.name} created successfully")
            except Exception as e:
                print(f"Error creating strategy {s.name}: {str(e)}")
                print(traceback.format_exc())
                raise HTTPException(status_code=400, detail=f"Error in strategy {s.name}: {str(e)}")
        
        print(f"Running backtest with {len(strategies)} strategies")
        df_result = run_backtest(df, strategies, input.fees, input.slippage)
        print("Backtest completed successfully")
        df_result.index = df_result.index.strftime('%Y-%m-%d')
        
        result = metrics_table(df_result, strategies)

        result = json.loads(json.dumps(result, default=numpy_to_python))

        print("Result prepared for return")
        #print(f"Date range in result: {result['equityCurve'][0]['date']} to {result['equityCurve'][-1]['date']}")
        print(df_result)
        # Convert NaN values to None (null in JSON)
        result = nan_to_null(result)
        
        return result
    except Exception as e:
        print(f"Error in backtest function: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))

def construct_rule_string(rules: List[RuleInput]) -> str:
    try:
        rule_strings = []
        for r in rules:
            left = f"{r.leftIndicator}({','.join(r.leftParams.values())})" if r.leftParams else r.leftIndicator
            if r.useRightIndicator:
                right = f"{r.rightIndicator}({','.join(r.rightParams.values())})" if r.rightParams else r.rightIndicator
            else:
                right = r.rightValue if r.rightValue is not None else ""
            rule_strings.append(f"{left} {r.operator} {right}")
        return " and ".join(rule_strings)
    except Exception as e:
        print(f"Error in construct_rule_string: {str(e)}")
        print(traceback.format_exc())
        raise


