from fastapi import FastAPI

print("Creating FastAPI app in test.py")
app = FastAPI()

print("Defining root route")
@app.get("/")
async def root():
    print("Root route accessed")
    return {"message": "Hello World"}

print("Defining test route")
@app.get("/test")
async def test():
    print("Test route accessed")
    return {"message": "This is a test"}

print("FastAPI app setup complete in test.py")

if __name__ == "__main__":
    import uvicorn
    print("Running app directly")
    uvicorn.run(app, host="0.0.0.0", port=8000)