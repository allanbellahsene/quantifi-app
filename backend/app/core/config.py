# app/core/config.py
import os
import logging

from typing import List
from dotenv import load_dotenv

from pydantic           import AnyHttpUrl
from pydantic_settings  import BaseSettings

# Logging setup
logging.basicConfig(
    level=logging.INFO,  # Set the logging level
    format="%(asctime)s [%(levelname)s] %(message)s",  # Log format
    handlers=[
        logging.StreamHandler(),  # Output to the console
        logging.FileHandler("app.log")  # Optionally log to a file
    ]
)


#load_dotenv()                               # Load environment variables from .env file
#DATABASE_URL            = os.getenv("DATABASE_URL") # Get the database URL from the environment variables
#GOOGLE_CLIENT_ID        = os.getenv("GOOGLE_CLIENT_ID")
#GOOGLE_CLIENT_SECRET    = os.getenv("GOOGLE_CLIENT_SECRET")

class Settings(BaseSettings):
    PROJECT_NAME: str = "QuantiFi"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    DATABASE_URL: str

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    
    SUPERADMIN_SECRET_KEY: str
    BOTADMIN_SECRET_KEY: str
    
    ALLOWED_ORIGINS: List[AnyHttpUrl] = ["http://localhost:3000"]  # Frontend URL
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "quantifi.log"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()