import base64
from urllib.parse import quote

import requests
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.services.fernet import decrypt_token


class NodeProcessor:
    """
    Handles file content fetching from GitHub and recursive chunking.
    """

    def __init__(self, session: str):
        chunk_separators = [
            "\nclass ",
            "\ndef ",
            "\nasync def ",
            "\ninterface ",
            "\ntype ",
            "\nexport ",
            "\n\n",
            "\n",
            " ",
            "",
        ]
        self.session = session
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=1800,
            chunk_overlap=240,
            separators=chunk_separators,
            keep_separator=True,
            is_separator_regex=False,
        )

    def fetch_contents(self, owner: str, repo: str, path: str) -> str:
        """
        Fetch and decode a single repository file from GitHub API.

        Expects `self.session` to be an encrypted GitHub token.
        """
        try:
            access_token = decrypt_token(self.session)
        except Exception as exc:
            raise RuntimeError("Failed to decrypt session token.") from exc

        encoded_path = quote(path, safe="/")
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{encoded_path}"
        res = requests.get(
            url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
            timeout=15,
        )
        if res.status_code != 200:
            raise RuntimeError(f"Failed to fetch file {path}: {res.status_code} {res.text}")

        data = res.json()
        encoded_content = data.get("content", "")
        if not isinstance(encoded_content, str) or not encoded_content:
            raise RuntimeError(f"Missing file content for {path}")

        try:
            return base64.b64decode(encoded_content, validate=False).decode("utf-8")
        except Exception as exc:
            raise RuntimeError(f"Failed to decode file content for {path}") from exc

    def create_chunks(self, content: str) -> list[str]:
        return self.splitter.split_text(content)


    def process_node(self, owner, repo, path):
        """Fetches a node's contents and, splits into chunks"""
        try:
            content = self.fetch_contents(owner, repo, path)
            return self.create_chunks(content)
        except Exception as e:
            raise RuntimeError(f"Missing file content for {path}") from e
        
