from fastapi import APIRouter

from app.api.endpoints import github
from app.api.endpoints import gemini
from app.api.endpoints import auth
from app.api.endpoints import db


api_router = APIRouter()

api_router.include_router(github.router, prefix="/repos")
api_router.include_router(gemini.router, prefix="/analyze")
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(db.router, prefix="/db", tags=["db"])
