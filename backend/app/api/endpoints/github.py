import os
import requests
from fastapi import APIRouter
from fastapi import HTTPException
from app.core.config import settings
import base64
router = APIRouter()




@router.get("/")
async def get_repos():
    res = requests.get(
        "https://api.github.com/user/repos",
        headers={"Authorization": f"Bearer {settings.GITHUB_TOKEN}"},
    )
    return res.json()


@router.get("/{owner}/{repo}/tree")
async def get_repo_tree(owner: str, repo: str):
    repo_res = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}",
        headers={"Authorization": f"Bearer {settings.GITHUB_TOKEN}"},
    )

    if repo_res.status_code != 200:
        raise HTTPException(status_code=repo_res.status_code, detail=repo_res.json())

    default_branch = repo_res.json()["default_branch"]

    # 2. get full recursive tree
    tree_res = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1",
        headers={"Authorization": f"Bearer {settings.GITHUB_TOKEN}"},
    )

    if tree_res.status_code != 200:
        raise HTTPException(status_code=tree_res.status_code, detail=tree_res.json())

    tree_data = tree_res.json()["tree"]

    # return only useful info
    return [
        {"path": item["path"], "type": item["type"]}
        for item in tree_data
    ]

#file?path=....
@router.get("/{owner}/{repo}/file")
async def get_file(owner: str, repo: str, path: str):
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"

    res = requests.get(
        url,
        headers={"Authorization": f"Bearer {settings.GITHUB_TOKEN}"},
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


