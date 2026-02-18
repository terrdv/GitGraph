import os
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import settings

DATABASE_URL = getattr(settings, "DATABASE_URL", None) or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def add_user(username: str) -> None:
    """Insert a user if it does not already exist."""
    print(DATABASE_URL)

    with engine.begin() as connection:

        connection.execute(
            text(
                """
                INSERT INTO users (github_id)
                VALUES (:github_id)
                ON CONFLICT (github_id) DO NOTHING
                """
            ),
            {"github_id": username},
        )


def add_access_token(username: str, access_token: str) -> None:
    """Insert or update the access token for a user."""
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS access_tokens (
                    id SERIAL PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    access_token TEXT NOT NULL,
                    FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO access_tokens (username, access_token)
                VALUES (:username, :access_token)
                ON CONFLICT (username) DO UPDATE SET access_token = EXCLUDED.access_token
                """
            ),
            {"username": username, "access_token": access_token},
        )