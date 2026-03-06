import os

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import settings

DATABASE_URL = getattr(settings, "DATABASE_URL", None) or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def ensure_repo() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS repos (
                    id BIGINT PRIMARY KEY,
                    name TEXT NOT NULL,
                    owner TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    last_updated TIMESTAMPTZ
                );
                """
            )
        )


def ensure_nodes() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS nodes (
                    id UUID PRIMARY KEY,
                    name TEXT,
                    path TEXT,
                    file_type TEXT,
                    repo_id BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                """
            )
        )


def ensure_edges() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS edges (
                    from_node UUID REFERENCES nodes(id) ON DELETE CASCADE,
                    to_node UUID REFERENCES nodes(id) ON DELETE CASCADE,
                    relationship TEXT,
                    repo_id BIGINT REFERENCES repos(id) ON DELETE CASCADE,
                    PRIMARY KEY(to_node, from_node)
                );
                """
            )
        )


def ensure_graph_tables() -> None:
    ensure_repo()
    ensure_nodes()
    ensure_edges()



