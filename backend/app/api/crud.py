# backtest/api/crud.py
from sqlalchemy.orm import Session

from app.models.user    import User

# Function to check if a user exists by username
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

# Function to check if a user exists by email
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

# Function to create or get a user by Google auth
def create_user_with_google(db: Session, user_info: dict):
    # Check if the user already exists in the database
    existing_user = db.query(User).filter(User.email == user_info['email']).first()
    
    if existing_user:
        return existing_user  # User already exists, return the user

    # Create a new user
    new_user = User(
        username=user_info['name'], 
        email=user_info['email'],
        hashed_password=None  # No password is needed for Google auth users
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user