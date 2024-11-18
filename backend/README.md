graph TB
    A[Main FastAPI App] --> B[API Layer]
    B --> C[Data Service]
    B --> D[Strategy Service]
    B --> E[Backtest Service]
    
    D --> F[Strategy Module]
