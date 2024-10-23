import socket

from fastapi                        import FastAPI
from fastapi.middleware.cors        import CORSMiddleware
from starlette.middleware.sessions  import SessionMiddleware

from app.api            import auth, protected_routes
from app.api.backtest   import backtest, BacktestInput
from app.core.config    import settings
from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request

app = FastAPI(title="QuantiFi API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Log the error details
    print(f"Validation error: {exc.errors()}")
    print(f"Request body: {exc.body}")
    # Return the errors in the response
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

@app.post("/api/backtest")
async def backtest_endpoint(input: BacktestInput):
    try:
        return await backtest(input)
    except Exception as e:
        print(f"Backtest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the auth routes
app.include_router(auth.router, prefix="/api/auth")

# Include the auth routes
app.include_router(protected_routes.router, prefix="/api/protected_routes")

if __name__ == "__main__":
    import uvicorn

    # Define the host and port you want to use
    host = "0.0.0.0"
    port = 8001

    # Check if the port is already in use
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        is_port_in_use = s.connect_ex((host, port)) == 0

    if is_port_in_use:
        print(f"Port {port} is already in use. Please stop the process using it or choose a different port.")
    else:
        # Start the server if the port is available
        uvicorn.run(app, host=host, port=port)




#from fastapi import FastAPI, HTTPException, Request
#from fastapi.middleware.cors import CORSMiddleware
#from app.api import auth, backtest, strategies, feedback
#from app.core.security import CustomException, custom_exception_handler
#from app.core.config import settings
#from app.utils.logging_config import logger

#async def http_exception_handler(request: Request, exc: HTTPException):
#    logger.error(f"HTTP error occurred: {exc.detail}")
#    return {"detail": str(exc.detail), "status_code": exc.status_code}

#async def general_exception_handler(request: Request, exc: Exception):
#    logger.error(f"An unexpected error occurred: {str(exc)}", exc_info=True)
#    return {"detail": "An unexpected error occurred.", "status_code": 500}

#def create_application() -> FastAPI:
#    application = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)
#
#    application.add_middleware(
#        CORSMiddleware,
#        allow_origins=settings.ALLOWED_ORIGINS,
#        allow_credentials=True,
#        allow_methods=["*"],
#       allow_headers=["*"],
#    )

    # API routers
    #application.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    #application.include_router(backtest.router, prefix="/api/v1/backtest", tags=["backtest"])
    #application.include_router(strategies.router, prefix="/api/v1/strategies", tags=["strategies"])
    #application.include_router(feedback.router, prefix="/api/v1/feedback", tags=["feedback"])

    # Exception handlers
    #application.add_exception_handler(CustomException, custom_exception_handler)
    #application.add_exception_handler(HTTPException, http_exception_handler)
    #application.add_exception_handler(Exception, general_exception_handler)

    #return application

#app = create_application()

#@app.get("/")
#async def root():
#    return {"message": "Welcome to QuantiFi API"}

#if __name__ == "__main__":
#    import uvicorn
#    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)