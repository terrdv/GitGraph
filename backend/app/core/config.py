import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

class Settings:
    """
    Application settings loaded from environment variables.
    """
    # API keys


    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN")

    # Server config
    HOST = "127.0.0.1"
    PORT = int(os.getenv("PORT"))
    RELOAD: bool = True
    

    # CORS config
    CORS_ORIGINS: list[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

settings = Settings()