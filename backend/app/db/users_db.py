import os
import secrets
import hashlib
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from app.services.fernet import encrypt_token
from app.services.fernet import decrypt_token
from app.core.config import settings

DATABASE_URL = getattr(settings, "DATABASE_URL", None) or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def create_user_with_token(username: str, token: str):
    token = encrypt_token(token)

    with engine.begin() as connection:
        connection.execute(
            text("""
                WITH inserted_user AS (
                    INSERT INTO users (username)
                    VALUES (:username)
                    ON CONFLICT (username) DO NOTHING
                    RETURNING id
                ),
                selected_user AS (
                    SELECT id FROM inserted_user
                    UNION
                    SELECT id FROM users WHERE username = :username
                )
                INSERT INTO access_tokens (user_id, token)
                SELECT id, :token FROM selected_user
                ON CONFLICT (user_id)
                DO UPDATE SET token = EXCLUDED.token;
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


def get_decrypted_token_for_username(username: str) -> str | None:
    """Load and decrypt a user's GitHub token from storage."""
    with engine.begin() as connection:
        row = connection.execute(
            text(
                """
                SELECT access_tokens.token
                FROM access_tokens
                JOIN users ON users.id = access_tokens.user_id
                WHERE users.username = :username
                LIMIT 1
                """
            ),
            {"username": username},
        ).fetchone()

    if not row or not row[0]:
        return None

    return decrypt_token(row[0])


def _ensure_sessions_table() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS user_sessions (
                    session_hash TEXT PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    expires_at TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
        )


def create_session_for_username(username: str, ttl_seconds: int = 60 * 60 * 24 * 7) -> str | None:
    """Create an opaque session for a username and return the raw session id."""
    _ensure_sessions_table()
    session_id = secrets.token_urlsafe(32)
    session_hash = hashlib.sha256(session_id.encode()).hexdigest()

    with engine.begin() as connection:
        row = connection.execute(
            text("SELECT id FROM users WHERE username = :username LIMIT 1"),
            {"username": username},
        ).fetchone()

        if not row:
            return None

        connection.execute(
            text(
                """
                INSERT INTO user_sessions (session_hash, user_id, expires_at)
                VALUES (:session_hash, :user_id, NOW() + (:ttl_seconds * INTERVAL '1 second'))
                """
            ),
            {
                "session_hash": session_hash,
                "user_id": row[0],
                "ttl_seconds": ttl_seconds,
            },
        )

    return session_id


def get_decrypted_token_for_session(session_id: str) -> str | None:
    """Resolve a session id to the user's decrypted GitHub token."""
    _ensure_sessions_table()
    session_hash = hashlib.sha256(session_id.encode()).hexdigest()
    with engine.begin() as connection:
        row = connection.execute(
            text(
                """
                SELECT access_tokens.token
                FROM user_sessions
                JOIN users ON users.id = user_sessions.user_id
                JOIN access_tokens ON access_tokens.user_id = users.id
                WHERE user_sessions.session_hash = :session_hash
                AND user_sessions.expires_at > NOW()
                LIMIT 1
                """
            ),
            {"session_hash": session_hash},
        ).fetchone()

    if not row or not row[0]:
        return None

    return decrypt_token(row[0])


def delete_session(session_id: str) -> None:
    """Invalidate a session by id."""
    _ensure_sessions_table()
    session_hash = hashlib.sha256(session_id.encode()).hexdigest()
    with engine.begin() as connection:
        connection.execute(
            text("DELETE FROM user_sessions WHERE session_hash = :session_hash"),
            {"session_hash": session_hash},
        )
