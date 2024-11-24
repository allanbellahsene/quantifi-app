import socket

from fastapi                        import FastAPI, Request
from fastapi.exceptions             import RequestValidationError
from fastapi.responses              import JSONResponse
from fastapi.middleware.cors        import CORSMiddleware
from starlette.middleware.sessions  import SessionMiddleware


from app.api            import auth, backtest, price
from app.core.config    import settings

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

# Include the routes
app.include_router(auth.router, prefix="/api/auth")
app.include_router(backtest.router, prefix="/api/backtest")
app.include_router(price.router, prefix="/api/price")

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