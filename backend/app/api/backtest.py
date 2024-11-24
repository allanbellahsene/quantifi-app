#app.api.backtest.py
import json
import traceback

from typing     import List
from fastapi    import HTTPException, APIRouter, Depends

from sqlalchemy.orm import Session

from app.utils.utils        import numpy_to_python, nan_to_null
from app.core.database      import get_db
from app.core.jwt_token     import get_current_user
from app.utils.data_fetcher import download_yf_data

from app.services.backtest.metrics          import metrics_table
from app.services.backtest.run_backtest     import run_backtest, Strategy
from app.services.backtest.trade_analysis   import analyze_all_trades

from app.models.user        import UserSchema
from app.models.strategy    import RuleInput
from app.models.backtest    import BacktestInput, BacktestResult_, BacktestResult, convert_backtest_result_to_input

###################################################################################################
""" Router Handler """
###################################################################################################

router = APIRouter()

@router.get("")
async def backtest_endpoint(input: BacktestInput):
    try:
        return await backtest(input)
    except Exception as e:
        print(f"Backtest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/saved")
async def backtest_saved(user: UserSchema = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return db.query(BacktestResult).filter(BacktestResult.email == user.email).all()
    except Exception as e:
        print(f"Backtest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/result/{id}")
async def backtest_results(id: int, user: UserSchema = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        backtest_input  = db.query(BacktestResult).order_by(BacktestResult.id == id, BacktestResult.email == user.email).first()
        backtest_input  = convert_backtest_result_to_input(backtest_input)

        result  = await backtest(input = backtest_input)

        return result
    except Exception as e:
        print(f"Backtest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save")
async def save_backtest(input: BacktestResult_, user: UserSchema = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        backtest_result = BacktestResult(
            email=user.email,
            symbol=input.symbol,
            start=input.start,
            end=input.end,
            fees=input.fees,
            slippage=input.slippage,
            strategies=json.dumps([s.dict() for s in input.strategies]),
            sharpe_ratio=input.sharpe_ratio,
            max_drawdown=input.max_drawdown,
            cagr=input.cagr
        )
        db.add(backtest_result)
        db.commit()
        db.refresh(backtest_result)
    except Exception as e:
        print(f"Backtest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

###################################################################################################
""" Backtest Function """
###################################################################################################

async def backtest(input: BacktestInput):
    try:
        print(f"Received backtest input: {input}")
        
        df = download_yf_data(input.symbol, input.start, input.end)
        print(f"Downloaded data for {input.symbol} from {input.start} to {input.end}")
        print(df.head())
        
        strategies = []
        for s in input.strategies:
            print(f"Processing strategy: {s.name}")
            try:
                entry_rule_str = construct_rule_string(s.entryRules)
                exit_rule_str = construct_rule_string(s.exitRules)
                
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
                )

                #### NEED TO TAKE INTO ACCOUNT ALLOCATION WHEN POSITION SIZE IS NOT FIXED

                strategies.append(strategy)
                print(f"Strategy {s.name} created successfully")
            except Exception as e:
                print(f"Error creating strategy {s.name}: {str(e)}")
                print(traceback.format_exc())
                raise HTTPException(status_code=400, detail=f"Error in strategy {s.name}: {str(e)}")
        
        print(f"Running backtest with {len(strategies)} strategies")
        df_result = run_backtest(df, strategies, input.fees, input.slippage)
        print("Backtest completed successfully")
        #df_result.index = df_result.index.strftime('%Y-%m-%d')

        print(df_result)
        
        result = metrics_table(df_result, strategies)

        result = json.loads(json.dumps(result, default=numpy_to_python))
        trades_df = analyze_all_trades(df_result, strategies).fillna(0)
        trades_list = trades_df.to_dict('records')
        result['trades'] = trades_list
        # Print for debugging
        print("Trades data:")
        print(result['trades'][:5])  # Print first 5 trades for brevity
        print(f"Number of trades: {len(result['trades'])}")
        print(f"Columns in each trade: {list(result['trades'][0].keys())}")


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



