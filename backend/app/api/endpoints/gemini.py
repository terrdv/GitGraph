from schemas import GeminiAnalysisRequest, GeminiSummaryRequest
from fastapi import APIRouter
from google import genai
router = APIRouter()

client = genai.Client(api_key=)

@router.post("/code_analysis", response_model=GeminiSummaryRequest)
async def code_analysis(request: GeminiAnalysisRequest):

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="given the following node provide a high level explanation of the contents",
        config={
            "response_mime_type": "application/json",
            "response_json_schema":  GeminiSummaryRequest.model_json_schema(),
        },
    )

    return response
