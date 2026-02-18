import requests
from fastapi import APIRouter, HTTPException
from fastapi import Query
from pydantic import BaseModel
from app.db.database import add_user
from app.core.config import settings

router = APIRouter()


class GitHubCodeExchangeRequest(BaseModel):
    code: str


@router.get("/github/login-url")
async def get_github_login_url(
    state: str | None = Query(default=None),
    scope: str = Query(default="repo read:user"),
):
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth is not configured. Set GITHUB_CLIENT_ID.",
        )

    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "scope": scope,
    }
    if state:
        params["state"] = state

    query = "&".join([f"{key}={requests.utils.quote(str(value))}" for key, value in params.items()])
    return {"url": f"https://github.com/login/oauth/authorize?{query}"}


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

    add_user(username)

    if not username:
        raise HTTPException(status_code=400, detail={"error": "Failed to fetch GitHub username", "github_response": user_data})

    return {
        "access_token": access_token,
        "token_type": data.get("token_type", "bearer"),
        "scope": data.get("scope", ""),
        "username": username,
    }
