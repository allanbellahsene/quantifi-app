from pydantic import BaseModel, EmailStr

class User(BaseModel):
    username: str
    email: EmailStr
    hashed_password: str

class UserInDB(User):
    id: int

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str