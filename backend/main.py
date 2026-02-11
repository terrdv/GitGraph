from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import api_router


# Create FastAPI application
app = FastAPI(
    title="GitGraph",
    description="Backend API for GitGraph",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Include API routes
app.include_router(api_router, prefix="")


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
        host=settings.HOST,  
        port=settings.PORT,
        reload=settings.RELOAD, 
    )