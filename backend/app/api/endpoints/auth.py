import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi import Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from app.db.users_db import create_user_with_token
from app.db.users_db import create_session_for_username
from app.db.users_db import delete_session
from app.core.config import settings

router = APIRouter()
DEFAULT_SCOPE = "repo read:user"
ALLOWED_SCOPES = {"repo", "read:user"}


class GitHubCodeExchangeRequest(BaseModel):
    code: str


@router.get("/github/login-url")
async def get_github_login_url(
    state: str | None = Query(default=None),
    scope: str = Query(default=DEFAULT_SCOPE),
):
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth is not configured. Set GITHUB_CLIENT_ID.",
        )

    requested_scopes = {item.strip() for item in scope.split(" ") if item.strip()}
    if not requested_scopes or not requested_scopes.issubset(ALLOWED_SCOPES):
        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth scope requested.",
        )

    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "scope": " ".join(sorted(requested_scopes)),
    }
    if settings.GITHUB_REDIRECT_URI:
        params["redirect_uri"] = settings.GITHUB_REDIRECT_URI
    if state:
        params["state"] = state

    query = "&".join([f"{key}={requests.utils.quote(str(value))}" for key, value in params.items()])
    return {"url": f"https://github.com/login/oauth/authorize?{query}"}


@router.get("/github/callback")
async def github_callback_bridge(request: Request):
    """
    Bridge callback for deployments where GitHub redirects to backend.
    Forwards OAuth query params to frontend callback route.
    """
    if not settings.FRONTEND_BASE_URL:
        raise HTTPException(
            status_code=500,
            detail="FRONTEND_BASE_URL is not configured.",
        )

    target = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/login/callback"
    query_string = request.url.query
    if query_string:
        target = f"{target}?{query_string}"
    return RedirectResponse(url=target, status_code=307)


@router.post("/github/exchange")
async def exchange_github_code(payload: GitHubCodeExchangeRequest):
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
        )

    token_payload = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": payload.code,
    }
    if settings.GITHUB_REDIRECT_URI:
        token_payload["redirect_uri"] = settings.GITHUB_REDIRECT_URI

    token_res = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data=token_payload,
        timeout=15,
    )

    data = token_res.json()
    if token_res.status_code != 200 or "access_token" not in data:
        raise HTTPException(status_code=400, detail=data)

    access_token = data["access_token"]
    user_res = requests.get(
        "https://api.github.com/user",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        },
        timeout=15,
    )
    user_data = user_res.json()
    username = user_data.get("login") if user_res.status_code == 200 else None

    create_user_with_token(username, access_token)

    if not username:
        raise HTTPException(status_code=400, detail={"error": "Failed to fetch GitHub username", "github_response": user_data})

    session_id = create_session_for_username(username)
    if not session_id:
        raise HTTPException(status_code=500, detail={"error": "Failed to create session"})

    return {
        "session_id": session_id,
        "username": username,
    }


@router.post("/logout")
async def logout(request: Request):
    session_id = request.headers.get("x-session-id", "").strip()
    if session_id:
        delete_session(session_id)
    return {"ok": True}
