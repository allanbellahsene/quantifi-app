import pandas as pd
from binance.client import Client
from datetime import datetime
import logging
from functools import wraps
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self.calls = []

    def __call__(self, func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            now = time.time()
            self.calls = [call for call in self.calls if call > now - self.period]
            if len(self.calls) >= self.max_calls:
                raise Exception("Rate limit exceeded. Please try again later.")
            self.calls.append(now)
            return func(*args, **kwargs)
        return wrapped

class RateLimitException(Exception):
    pass

@RateLimiter(max_calls=5, period=60)  # 5 calls per minute
def fetch_binance_data(symbol: str, start_date: str, end_date: str, interval='1d'):
    try:
        client = Client()  # Initialize without API keys for public data
        
        # Convert date strings to milliseconds timestamp
        start_ms = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp() * 1000)
        end_ms = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp() * 1000)
        
        # Fetch klines data
        klines = client.get_historical_klines(symbol, interval, start_ms, end_ms)
        
        # Convert to DataFrame
        df = pd.DataFrame(klines, columns=['timestamp', 'Open', 'High', 'Low', 'Close', 'Volume', 'Close time', 'Quote asset volume', 'Number of trades', 'Taker buy base asset volume', 'Taker buy quote asset volume', 'Ignore'])
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        
        # Set timestamp as index
        df.set_index('timestamp', inplace=True)
        
        # Convert relevant columns to float
        for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
            df[col] = df[col].astype(float)
        
        # Drop unnecessary columns
        df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
        
        logger.info(f"Successfully fetched data for {symbol} from {start_date} to {end_date}")
        return df
    
    except RateLimitException as e:
        logger.error(f"Rate limit exceeded: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {str(e)}")
        raise

# Function to fetch BTC data for regime filter
def fetch_btc_data(start_date: str, end_date: str, interval='1d'):
    return fetch_binance_data('BTCUSDT', start_date, end_date, interval)