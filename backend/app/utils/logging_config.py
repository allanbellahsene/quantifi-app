# app/utils/logging_config.py
import logging
from logging.handlers import RotatingFileHandler
from app.core.config import settings

def setup_logging():
    logger = logging.getLogger("quantifi")
    logger.setLevel(logging.getLevelName(settings.LOG_LEVEL))

    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # File Handler
    file_handler = RotatingFileHandler(
        settings.LOG_FILE, 
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger

logger = setup_logging()