# app/services/data/data_service.py
from typing import Dict
import pandas as pd
import logging
from app.services.data.data_fetcher import download_yf_data, fetch_binance_data
from app.models.backtest import StrategyInput

logger = logging.getLogger(__name__)

class DataService:
    BINANCE_INTERVALS = {
        'Daily': '1d',
        '4h': '4h',
        '1h': '1h',
        '30m': '30m',
        '15m': '15m',
        '10m': '10m',
        '5m': '5m',
        '1m': '1m',
    }

    @staticmethod
    async def fetch_data(symbol: str, start: str, end: str, data_source: str, 
                        strategies: list[StrategyInput]) -> Dict[str, pd.DataFrame]:
        """
        Fetches data for all required frequencies and regime filter assets.
        """
        frequencies = set(s.frequency for s in strategies)
        regime_assets = {s.regimeAsset for s in strategies if s.regimeAsset}
        data_dict = {}

        # Fetch main symbol data for each frequency
        for freq in frequencies:
            try:
                df = await DataService._fetch_single_frequency(
                    symbol, start, end, data_source, freq
                )
                data_dict[freq] = df
                logger.info(f"Data fetched successfully for frequency: {freq}")
            except Exception as e:
                logger.error(f"Error fetching data for frequency {freq}: {str(e)}")
                raise

        # Fetch regime filter asset data
        for regime_asset in regime_assets:
            if regime_asset and regime_asset != symbol:
                try:
                    regime_df = await DataService._fetch_single_frequency(
                        regime_asset, start, end, data_source, 'Daily'  # Always use daily for regime filter
                    )
                    data_dict[f"regime_{regime_asset}"] = regime_df
                    logger.info(f"Regime filter data fetched for {regime_asset}")
                except Exception as e:
                    logger.error(f"Error fetching regime filter data for {regime_asset}: {str(e)}")
                    raise

        return data_dict

    @staticmethod
    async def _fetch_single_frequency(symbol: str, start: str, end: str, 
                                    data_source: str, freq: str) -> pd.DataFrame:
        """Fetches data for a single frequency from the specified data source."""
        if data_source == 'Yahoo Finance':
            if freq != 'Daily':
                raise ValueError(f'Yahoo Finance only supports Daily frequency, but {freq} was requested.')
            return download_yf_data(symbol, start, end)
        
        elif data_source == 'Binance':
            interval = DataService.BINANCE_INTERVALS.get(freq)
            if not interval:
                raise ValueError(f'Invalid frequency {freq} for Binance data source.')
            return fetch_binance_data(symbol, start, end, interval=interval)
        
        else:
            raise ValueError(f'Data source can only be "Yahoo Finance" or "Binance"')