"""
Data ingestion API endpoints for the selected repo.
"""
import logging
from fastapi import APIRouter, HTTPException, Request

from app.codeIngestion.code_ingestion import RepositoryIngestionOrchestrator
from app.db.users import get_decrypted_token_for_session
from app.schemas.ingestion import IngestionRequest, IngestionResponse
from app.services.fernet import encrypt_token

router = APIRouter()
logger = logging.getLogger(__name__)

def _resolve_github_token(request: Request) -> str:
    """Resolve GitHub token from Bearer auth header or session id."""
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        session_id = request.headers.get("x-session-id", "").strip()
        token = get_decrypted_token_for_session(session_id) if session_id else None

    if not token:
        raise HTTPException(status_code=401, detail="Missing GitHub credentials.")

    return token


@router.post("/repo", response_model=IngestionResponse)
async def ingest_repo(request: Request, payload: IngestionRequest):
    """
    Ingest one repository graph into PGVector.
    Trigger this after frontend graph loading completes.
    """
    try:
        github_token = _resolve_github_token(request)
        encrypted_session = encrypt_token(github_token)
        orchestrator = RepositoryIngestionOrchestrator(session=encrypted_session)

        existing_embeddings = orchestrator.get_existing_embedding_count(
            owner=payload.owner,
            repo=payload.repo,
        )
        if existing_embeddings > 0:
            return IngestionResponse(
                message="Repository embeddings already exist. Reusing stored collection.",
                status="success",
                thread_id=f"{payload.owner}/{payload.repo}",
                chunks_processed=existing_embeddings,
            )

        graph_payload = (
            payload.graph.model_dump()
            if hasattr(payload.graph, "model_dump")
            else payload.graph.dict()
        )
        chunks_processed = orchestrator.ingest_repo_tree(
            owner=payload.owner,
            repo=payload.repo,
            tree_payload=graph_payload,
        )

        return IngestionResponse(
            message="Repository ingestion completed.",
            status="success",
            thread_id=f"{payload.owner}/{payload.repo}",
            chunks_processed=chunks_processed,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Repository ingestion failed for %s/%s", payload.owner, payload.repo)
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}") from exc
