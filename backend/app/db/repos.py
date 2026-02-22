from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

def ensure_repo():
    with engine.begin() as connection:


DATABASE_URL = getattr(settings, "DATABASE_URL", None) or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

def ensure_nodes():

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS nodes (
                    id UUID PRIMARY KEY,
                    name text,
                    path text,
                    file_type text,
                    repo_id BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE
                );
                """
            )
        )

