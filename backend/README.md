graph TB
    subgraph Main["FastAPI Application (main.py)"]
        EP["/api/backtest Endpoint"]
    end

    subgraph API["API Layer"]
        BT["/api/backtest.py"]
        EP --> BT
    end

    subgraph Services["Services Layer"]
        subgraph DataService["Data Service"]
            DS["/services/data/data_service.py"]
            DF["/utils/data_fetcher.py"]
            DS --> DF
        end

        subgraph StrategyService["Strategy Service"]
            SS["/services/strategy_service/strategy.py"]
            subgraph StrategyModule["Strategy Module"]
                SM["/services/strategy_module/strategy.py"]
                EX["/services/strategy_module/expressions.py"]
                IND["/services/strategy_module/indicators.py"]
                RP["/services/strategy_module/rule_parser.py"]
                SIG["/services/strategy_module/signals.py"]
                SM --> EX
                SM --> IND
                SM --> RP
                SM --> SIG
            end
            SS --> SM
        end

        subgraph BacktestService["Backtest Service"]
            RB["/services/backtest/run_backtest.py"]
            MC["/services/backtest/metrics_calculator.py"]
            MT["/services/backtest/metrics.py"]
            TA["/services/backtest/trade_analysis.py"]
            RB --> MC
            RB --> MT
            RB --> TA
        end
    end

    subgraph Models["Models Layer"]
        MOD["/models/backtest.py"]
    end

    BT --> DS
    BT --> SS
    BT --> RB
    
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px
    classDef service fill:#e1f5fe,stroke:#333,stroke-width:2px
    classDef module fill:#fff3e0,stroke:#333,stroke-width:2px
    
    class Main,API,Models default
    class DataService,StrategyService,BacktestService service
    class StrategyModule module
