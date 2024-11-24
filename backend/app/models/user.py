# app.models.user.py
import enum

from typing     import Union
from pydantic   import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, Enum

from app.core.database  import Base

class UserRole(enum.Enum):
    baseuser    = "user"
    botadmin    = "botadmin"
    superadmin  = "superadmin"

###################################################################################################
""" User pydantic Model """
###################################################################################################

"""
Data Validation and API Schema (Pydantic Model):
    Used to define request/response data for your API
    
    The Pydantic model is designed to ensure that data being sent to or from the API follows specific rules
    e.g., email must be valid, username must be a string.
    It ensures that incoming data is clean and safe before it is processed
    e.g., before it's passed to the SQLAlchemy model to save to the database.
"""

class UserSchema(BaseModel):
    username: str
    email: EmailStr
    role: UserRole

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username_email: Union[str, EmailStr]
    password: str
    
class Token(BaseModel):
    access_token: str
    token_type: str

###################################################################################################
""" User SQLAlchemy Model """
###################################################################################################

"""
Database Operations (SQLAlchemy Model):
    Used for database operations (CRUD)

    The SQLAlchemy model is designed to represent how data is structured in the database.
    It includes database-specific attributes like primary keys (id), indexing, and column definitions.
"""

class User(Base):
    __tablename__ = "users"
    
    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, index=True)
    email           = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role            = Column(Enum(UserRole), default=UserRole.baseuser, nullable=False)