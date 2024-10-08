import socket
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.backtest_new import backtest, BacktestInput

app = FastAPI(title="QuantiFi API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to QuantiFi API"}

@app.get("/api/test")
async def test():
    return {"message": "Backend is connected"}

@app.post("/api/backtest")
async def backtest_endpoint(input: BacktestInput):
    return await backtest(input)

if __name__ == "__main__":
    import uvicorn

    # Define the host and port you want to use
    host = "0.0.0.0"
    port = 8000

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