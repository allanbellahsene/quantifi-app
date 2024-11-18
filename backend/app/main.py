import socket
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.backtest import backtest, BacktestInput
from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

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
    logger.info(f"Validation error: {exc.errors()}")
    logger.info(f"Request body: {exc.body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.get("/")
async def root():
    return {"message": "Welcome to QuantiFi API"}

@app.get("/api/test")
async def test():
    return {"message": "Backend is connected"}

@app.post("/api/backtest")
async def backtest_endpoint(request: Request, input: BacktestInput):
    try:
        body = await request.json()
        logger.info(f"Backtest request body: {body}")
        response = await backtest(input)
        #logger.info(f"Backtest response: {response}")
        return await backtest(input)
    except Exception as e:
        logger.info(f"Backtest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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