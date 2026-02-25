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
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET")
    GITHUB_REDIRECT_URI: str = os.getenv("GITHUB_REDIRECT_URI")
    FRONTEND_BASE_URL: str = os.getenv("FRONTEND_BASE_URL")

    # Server config
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT"))
    RELOAD: bool = True
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # Encryption
    FERNET_KEY: str = os.getenv("FERNET_KEY")

    # CORS config
    CORS_ORIGINS: list[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

settings = Settings()
