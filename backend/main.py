from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router


# Create FastAPI application
app = FastAPI(
    title="GitGraph",
    description="Backend API for GitGraph",
    version="0.1.0",
)

# Add CORS middleware for extension support
app.add_middleware(
    CORSMiddleware,
    allow_origins="http://localhost:3000",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="")  # ✅ Use config!


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "GitGraph", 
        "status": "running",
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",  # ✅ Use config!
        port=8000,  # ✅ Use config!
        reload=True,  # ✅ Use config!
    )