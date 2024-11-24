# scripts/seed_superadmin.py
import os

from dotenv import load_dotenv

from app.core.database      import SessionLocal  # Use the session directly
from app.models.user        import UserRole, UserRegister
from app.services.auth.crud import create_user

# Load environment variables from .env file
load_dotenv()

def seed_superadmin():
    # Manually create a database session
    db = SessionLocal()
    try:
        # Define the superadmin user
        superadmin = UserRegister(
            username="superadmin",
            email="superadmin@example.com",
            password=os.getenv("SUPERADMIN_SECRET_KEY"),
        )
        
        # Add the superadmin to the database
        new_user = create_user(db, user=superadmin, role=UserRole.superadmin)
        print(f"Superadmin {new_user.username} created successfully")
    except Exception as e:
        print(f"Error creating superadmin: {e}")
    finally:
        # Ensure the session is closed
        db.close()

if __name__ == "__main__":
    seed_superadmin()

