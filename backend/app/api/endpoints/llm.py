from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.schemas.gemini_requests import GeminiAnalysisRequest, GeminiSummaryRequest
from app.textGeneration.llm_service import get_llm_response, stream_llm_response

router = APIRouter()

@router.post("/code_analysis", response_model=GeminiSummaryRequest)
async def code_analysis(request: GeminiAnalysisRequest):
    pass


class ChatRequest(BaseModel):
    owner: str
    repo: str
    query: str


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_repo(payload: ChatRequest, request: Request):
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")

    session_id = request.headers.get("x-session-id", "").strip()
    try:
        answer = get_llm_response(
            query=payload.query.strip(),
            repo_id=f"{payload.owner}/{payload.repo}",
            session_id=session_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat failed: {exc}") from exc

    return ChatResponse(answer=answer)


@router.post("/chat/stream")
async def chat_with_repo_stream(payload: ChatRequest, request: Request):
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")

    session_id = request.headers.get("x-session-id", "").strip()

    def token_generator():
        for token in stream_llm_response(
            query=payload.query.strip(),
            repo_id=f"{payload.owner}/{payload.repo}",
            session_id=session_id,
        ):
            yield token

    return StreamingResponse(token_generator(), media_type="text/plain; charset=utf-8")
