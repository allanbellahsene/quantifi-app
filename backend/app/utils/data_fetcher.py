import pandas as pd
from binance.client import Client
from datetime import datetime
import logging
from functools import wraps
import time
import yfinance as yf

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


def map_symbol_to_binance(symbol: str) -> str:
    """
    Map a symbol to Binance's format.
    """
    # Replace '-' with '' and change 'USD' to 'USDT'
    if '-' in symbol:
        base, quote = symbol.split('-')
        if quote == 'USD':
            quote = 'USDT'
        binance_symbol = f'{base}{quote}'
    else:
        binance_symbol = symbol

    return binance_symbol.upper()


@RateLimiter(max_calls=5, period=60)  # 5 calls per minute
def fetch_binance_data(symbol: str, start_date: str, end_date: str, interval='1d'):
    try:
        client = Client()  # Initialize without API keys for public data
        
        # Convert date strings to milliseconds timestamp
        start_ms = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp() * 1000)
        end_ms = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp() * 1000)

        symbol = map_symbol_to_binance(symbol)
        
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
        df.index.names = ['Date']
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

def download_yf_data(symbol: str, start: str, end: str) -> pd.DataFrame:
    """
    Download price data from yahoo finance for the given symbol and BTC-USD for the specified date range.

    :param symbol: The ticker symbol to download data for
    :param start: Start date for the data
    :param end: End date for the data
    :return: DataFrame containing price data for the symbol and BTC-USD
    """
    df: pd.DataFrame = yf.download(symbol, start=start, end=end)[['Open', 'High', 'Low', 'Close', 'Volume']]
    btc: pd.DataFrame = yf.download('BTC-USD', start=start, end=end)[['Close']].rename(columns={'Close': 'BTC-USD'})
    return df.merge(btc, right_index=True, left_index=True, how='left')

if __name__ == "__main__":
    df_yf = download_yf_data(symbol='BTC-USD', start='2020-01-01', end='2024-01-01')
    df_binance = fetch_binance_data(symbol='BTCUSDT', start_date='2020-01-01', end_date='2024-01-01',
    interval='30m')

    #### I AM COMPARING THE STRUCTURE OF THE YAHOO FINANCE AND BINANCE DATA, IN ORDER TO DEFINE A COMMON STRUCTURE FOR ALL MY DATASOURCES
    ### SINCE THE APP CURRENTLY WORKS WITH YAHOO FINANCE DATA, ALL SUBSEQUENT DATA SOURCES WILL BE STRUCTURED IN THE SAME WAY AS YAHOO FINANCE

    print('Yahoo finance data:')
    print(df_yf.columns)
    print(df_yf.index)

    print('Binance data:')
    print(df_binance.columns)
    print(df_binance.index)

    print(df_yf.head())

    print(df_binance.head())
