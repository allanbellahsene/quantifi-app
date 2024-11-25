#app.main.py

import socket
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.backtest import backtest, BacktestInput
from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.api.auth import router as auth_router, get_current_user, User
from app.api.saved_backtest import router as saved_backtest_router
from fastapi import Depends
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

app = FastAPI(title="QuantiFi API", version="1.0.0")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    logger.error(f"Request body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

# Middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request path: {request.url.path}")
    try:
        if request.url.path.startswith("/api/auth"):
            body = await request.body()
            logger.info(f"Auth request body: {body.decode()}")
    except Exception as e:
        logger.error(f"Error logging request: {e}")
    
    response = await call_next(request)
    return response

app.include_router(auth_router)
app.include_router(saved_backtest_router)

@app.get("/")
async def root():
    return {"message": "Welcome to QuantiFi API"}

@app.get("/api/test")
async def test():
    return {"message": "Backend is connected"}

@app.post("/api/backtest")
async def backtest_endpoint(
    request: Request, 
    input: BacktestInput, 
    current_user: User = Depends(get_current_user)
):
    try:
        body = await request.json()
        logger.info(f"Backtest request body: {body}")
        response = await backtest(input)
        return response
    except Exception as e:
        logger.error(f"Backtest error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

def start_server():
    import uvicorn
    host = "0.0.0.0"
    port = 8001
    
    # Check if port is available
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        is_port_in_use = s.connect_ex((host, port)) == 0
    
    if is_port_in_use:
        logger.error(f"Port {port} is already in use. Please stop the process using it or choose a different port.")
        sys.exit(1)
    else:
        logger.info(f"Starting server on {host}:{port}")
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
            access_log=True
        )

if __name__ == "__main__":
    start_server()