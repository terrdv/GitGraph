import requests
from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Request
from app.db.users_db import get_decrypted_token_for_session
from app.services.build_tree import build_tree
import base64
router = APIRouter()


def github_auth_headers(request: Request) -> dict[str, str]:
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        session_id = request.headers.get("x-session-id", "").strip()
        token = get_decrypted_token_for_session(session_id) if session_id else None

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing GitHub credentials.",
        )

    return {"Authorization": f"Bearer {token}"}



@router.get("/")
async def get_repos(request: Request):
    res = requests.get(
        "https://api.github.com/user/repos",
        headers=github_auth_headers(request),
        timeout=15,
    )
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=res.json())
    return res.json()


@router.get("/{owner}/{repo}/tree")
async def get_repo_tree(owner: str, repo: str, request: Request):
    headers = github_auth_headers(request)

    repo_res = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}",
        headers=headers,
        timeout=15,
    )

    if repo_res.status_code != 200:
        raise HTTPException(status_code=repo_res.status_code, detail=repo_res.json())

    repo_data = repo_res.json()
    default_branch = repo_data["default_branch"]

    # 2. get full recursive tree
    tree_res = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1",
        headers=headers,
        timeout=15,
    )

    if tree_res.status_code != 200:
        raise HTTPException(status_code=tree_res.status_code, detail=tree_res.json())

    tree_data = tree_res.json()["tree"]

    # 1. Filter by type tree, then set up directories as a list of nodes
    # 2. Insert files as nodes, 
    # 3. Return new graph

    graph = build_tree(tree_data)
    return {
        "repo_id": repo_data.get("id"),
        "nodes": graph.nodes,
        "edges": graph.edges,
    }



#file?path=....
@router.get("/{owner}/{repo}/file")
async def get_file(owner: str, repo: str, path: str, request: Request):
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"

    res = requests.get(
        url,
        headers=github_auth_headers(request),
        timeout=15,
    )

    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=res.json())

    data = res.json()

    # decode base64 → text
    content = base64.b64decode(data["content"]).decode("utf-8")

    return {
        "path": path,
        "content": content,
    }
