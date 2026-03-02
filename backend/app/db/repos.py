from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

def ensure_repo():
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS repos (
                    id BIGINT PRIMARY KEY,
                    name text NOT NULL,
                    owner text NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                    last_updated TIMESTAMPTZ
                );
                """
            )
        )


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
                    updated_at 
                );
                """
            )
        )

def ensure_edges():
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS edges (
                    from UUID REFERENCES nodes(id) ON DELETE CASCADE,
                    to UUID REFERENCES nodes(ud) ON DELETE CASCADE,
                    relationship text,
                    repo BIGINT REFERENCES repos(id),
                    PRIMARY KEY(to,from)
                );
                """
            )
        )




