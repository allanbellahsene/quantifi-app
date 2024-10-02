# app/utils/logging_config.py

import logging
from logging.handlers import RotatingFileHandler
import os

def setup_logger(name, log_file, level=logging.INFO):
    """Function to setup as many loggers as you want"""

    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    
    handler = RotatingFileHandler(log_file, maxBytes=10000000, backupCount=5)
    handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(handler)

    return logger

# Ensure log directory exists
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

# Setup loggers
main_logger = setup_logger('main_logger', 'logs/main.log')
backtest_logger = setup_logger('backtest_logger', 'logs/backtest.log')