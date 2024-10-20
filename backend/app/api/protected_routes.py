# app/api/protected_routes.py

from fastapi    import APIRouter, Depends

from app.core.jwt_token import get_current_user

from app.core.config import logging, settings
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/protected")
async def protected_route(current_user: str = Depends(get_current_user)):
    logger.info(f"User: {current_user}")
    return {"message": "You have access!", "user": current_user}
