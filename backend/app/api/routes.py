from fastapi import APIRouter

from app.api.endpoints import github


api_router = APIRouter()

api_router.include_router(github.router, prefix="/repos")