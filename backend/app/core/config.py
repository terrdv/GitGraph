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
