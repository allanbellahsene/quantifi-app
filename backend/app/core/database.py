# backtest/core/database.py
from sqlalchemy                 import create_engine
from sqlalchemy.orm             import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from app.core.config    import settings

# Create the SQLAlchemy engine
engine = create_engine(settings.DATABASE_URL)

# Create a configured "Session" class
SessionLocal    = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for the ORM models
Base    = declarative_base()

# Dependency for getting a session in FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
