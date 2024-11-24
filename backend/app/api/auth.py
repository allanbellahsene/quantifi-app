#backend/app/api/auth.py
import secrets

from sqlalchemy.orm     import Session
from fastapi            import APIRouter, Depends, HTTPException, Request, Response

from authlib.integrations.starlette_client import OAuth

from app.services.auth.crud import get_user_by_username, get_user_by_email, create_user_with_google, create_user
from app.models.user        import User, UserRegister, UserLogin, Token, UserRole, UserSchema
from app.core.security      import verify_password
from app.core.jwt_token     import set_cookie_token, superadmin_required
from app.core.database      import get_db

from app.core.config import logging, settings
logger = logging.getLogger(__name__)

###################################################################################################
""" Route Handler """
###################################################################################################

router = APIRouter()

# User registration route
@router.post("/register", response_model=Token)
async def register(response: Response, user: UserRegister, db: Session = Depends(get_db)):
    # Create User if it doesn't exist
    new_user    = create_user(db, user = user, role = UserRole.baseuser)
    
    # Create JWT token for the user
    return set_cookie_token(response, UserSchema(username=new_user.username, email=new_user.email, role= new_user.role))

# User login route
@router.post("/login", response_model=Token)
async def login(response: Response, user: UserLogin, db: Session = Depends(get_db)):
    # Check if user exists
    db_username = get_user_by_username(db, user.username_email)
    db_email    = get_user_by_email(db, user.username_email)
    if not db_username and not db_email:
        raise HTTPException(status_code=400, detail="Invalid username, email or password")
    
    db_user = db_username if db_username else db_email
    logger.info(f"{db_user}")
    
    # Verify the password
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid username, email or password")
    
    # Create JWT token for the user
    return set_cookie_token(response, UserSchema(username=db_user.username, email=db_user.email, role= db_user.role))

###################################################################################################
""" Register with Google Account """
###################################################################################################

# Set up OAuth client with Google
oauth = OAuth()

# Register Google OAuth client
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,   # Get from .env or Google Console
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',  # Important for OpenID Connect
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    access_token_url='https://oauth2.googleapis.com/token',
    access_token_params=None,
    userinfo_endpoint='https://www.googleapis.com/oauth2/v3/userinfo',
    client_kwargs={'scope': 'openid email profile'}
)

@router.get("/login/google")
async def google_login(request: Request):
    # Generate a nonce
    nonce = secrets.token_urlsafe(32)
    request.session['nonce'] = nonce

    redirect_uri = request.url_for('auth_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri, nonce=nonce)

@router.get("/callback")
async def auth_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    token       = await oauth.google.authorize_access_token(request)
    nonce = request.session.get('nonce')
    user_info   = await oauth.google.parse_id_token(token, nonce=nonce)
    
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")

    # You can now create or find the user in your database
    user    = create_user_with_google(db, user_info)
    
    # Create JWT token for the user
    return set_cookie_token(response, UserSchema(username=user.username, email=user.email, role= user.role))

###################################################################################################
""" Handle Bot Admin User """
###################################################################################################

@router.post("/create-botadmin", response_model=dict)
async def create_botadmin(
                            user: UserRegister,
                            current_user: User = Depends(superadmin_required),
                            db: Session = Depends(get_db)
                        ):
    """
    Create a new botadmin user. Only superadmin can perform this action.
    """
    
    # Create User if it doesn't exist
    new_user    = create_user(db, user = user, role = UserRole.baseuser)
    
    return {"message": f"Botadmin {new_user.username} created successfully"}
