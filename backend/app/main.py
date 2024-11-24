import socket
import logging

from fastapi                        import FastAPI, Request
from fastapi.exceptions             import RequestValidationError
from fastapi.responses              import JSONResponse
from fastapi.middleware.cors        import CORSMiddleware
from starlette.middleware.sessions  import SessionMiddleware

from app.api            import auth, backtest, price
from app.core.config    import settings

logger = logging.getLogger(__name__)

app = FastAPI(title="QuantiFi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

# Add Session middleware for session management (needed for OAuth flows)
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

@app.get("/")
async def root():
    return {"message": "Welcome to QuantiFi API"}

@app.get("/api/test")
async def test():
    return {"message": "Backend is connected"}

# Include the routes
app.include_router(auth.router, prefix="/api/auth")
app.include_router(backtest.router, prefix="/api/backtest")
app.include_router(price.router, prefix="/api/price")

if __name__ == "__main__":
    import uvicorn
    host = "0.0.0.0"
    port = 8001
    
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        is_port_in_use = s.connect_ex((host, port)) == 0
    
    if is_port_in_use:
        logger.info(f"Port {port} is already in use. Please stop the process using it or choose a different port.")
    else:
        uvicorn.run(app, host=host, port=port)