from fastapi import APIRouter

from app.api.endpoints import github
from app.api.endpoints import gemini


api_router = APIRouter()

api_router.include_router(github.router, prefix="/repos")
api_router.include_router(gemini.router, prefix="analyze")