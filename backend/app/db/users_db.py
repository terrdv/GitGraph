import os
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from app.services.fernet import encrypt_token
from app.core.config import settings

DATABASE_URL = getattr(settings, "DATABASE_URL", None) or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True)


from sqlalchemy import text

def create_user_with_token(username: str, token: str):

    token = encrypt_token(token)
    with engine.begin() as connection:
        connection.execute(
            text("""
                WITH new_user AS (
                    INSERT INTO users (username)
                    VALUES (:username)
                    RETURNING id
                )
                INSERT INTO access_tokens (user_id, token)
                SELECT id, :token FROM new_user
            """),
            {"username": username, "token": token}
        )
  


def add_user(username: str) -> None:
    """Insert a user if it does not already exist."""

    with engine.begin() as connection:

        connection.execute(
            text(
                """
                INSERT INTO users (username)
                VALUES (:username)
                ON CONFLICT (username) DO NOTHING
                """
            ),
            {"username": username},
        )


def add_access_token(username: str, access_token: str) -> None:
    """Insert or update the access token for a user."""
    token = encrypt_token(access_token)
    with engine.begin() as connection:
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
    
def delete_user(username: str) -> None:
    """Delete a user"""
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                DELETE FROM users
                WHERE username = :username
                """
            ),
            {"username": username}
        )

def delete_token(encrypted_token: str) -> None:
    """Delete access token"""
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                DELETE FROM access_tokens
                WHERE token = :token
                """
            ),
            {"token": encrypted_token}
        )


