# backtest/api/crud.py
from fastapi        import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user    import User, UserRegister, UserRole, UserSchema
from app.core.security  import get_password_hash

# Function to check if a user exists by username
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

# Function to check if a user exists by email
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

# check if a user with a given username + email address already exists
def check_user_exists(db: Session, username: str, email: str):
    existing_user = db.query(User).filter((User.username == username) | (User.email == email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username or email already exists",
        )
    
    """
    db_username = get_user_by_username(db, user.username)
    db_email    = get_user_by_email(db, user.email)
    if db_username:
        raise HTTPException(status_code=400, detail="Username already registered")
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    """

# Create new user and add it to the database
def create_user(db: Session, user: UserRegister, role: UserRole = UserRole.baseuser) -> UserSchema:
    # Check if user already exists
    check_user_exists(db, username = user.username, email = user.email)
    
    # Hash the password and create a new user
    hashed_password = get_password_hash(user.password)
    new_user        = User(
                            username=user.username,
                            email=user.email,
                            hashed_password=hashed_password,
                            role=role
                        )
    
    # Save user in the database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Return UserSchema
    return UserSchema(username=new_user.username, email=new_user.email, role=new_user.role)

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