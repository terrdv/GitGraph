from app.schemas.gemini_requests import GeminiAnalysisRequest, GeminiSummaryRequest
from fastapi import APIRouter
from app.core.config import settings
from google import genai
router = APIRouter()
#client = genai.Client(api_key=settings.OPENAI_API_KEY)

@router.post("/code_analysis", response_model=GeminiSummaryRequest)
async def code_analysis(request: GeminiAnalysisRequest):
    pass
