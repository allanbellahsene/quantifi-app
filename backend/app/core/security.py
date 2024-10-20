from passlib.context    import CryptContext
from fastapi            import Request
from fastapi.responses  import JSONResponse

###################################################################################################
""" Manage Password Hashing """
###################################################################################################

# Initialize a CryptContext for bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Function to hash the password
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password.encode('utf-8'))

# Function to verify if the provided password matches the hashed password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

###################################################################################################

class CustomException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code    = status_code
        self.detail         = detail

def custom_exception_handler(request: Request, exc: CustomException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )