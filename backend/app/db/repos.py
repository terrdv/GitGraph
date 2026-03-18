import os

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import settings
from app.schemas.node import Edge, GraphPayload, Node

DATABASE_URL = getattr(settings, "DATABASE_URL", None) or os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine: Engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def _column_type(table_name: str, column_name: str) -> str | None:
    with engine.begin() as connection:
        result = connection.execute(
            text(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_name = :table_name AND column_name = :column_name
                """
            ),
            {"table_name": table_name, "column_name": column_name},
        )
        return result.scalar_one_or_none()


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
                    last_updated TIMESTAMPTZ DEFAULT NOW()
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
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    path TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    repo_id BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                """
            )
        )

    if _column_type("nodes", "id") == "uuid":
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_from_node_fkey;
                    ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_to_node_fkey;
                    ALTER TABLE nodes ALTER COLUMN id TYPE TEXT USING id::text;
                    """
                )
            )


def ensure_edges() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS edges (
                    from_node TEXT NOT NULL,
                    to_node TEXT NOT NULL,
                    relationship TEXT,
                    repo_id BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
                    PRIMARY KEY(to_node, from_node),
                    FOREIGN KEY (from_node) REFERENCES nodes(id) ON DELETE CASCADE,
                    FOREIGN KEY (to_node) REFERENCES nodes(id) ON DELETE CASCADE
                );
                """
            )
        )

    if _column_type("edges", "from_node") == "uuid" or _column_type("edges", "to_node") == "uuid":
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_pkey;
                    ALTER TABLE edges ALTER COLUMN from_node TYPE TEXT USING from_node::text;
                    ALTER TABLE edges ALTER COLUMN to_node TYPE TEXT USING to_node::text;
                    ALTER TABLE edges ADD PRIMARY KEY(to_node, from_node);
                    ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_from_node_fkey;
                    ALTER TABLE edges DROP CONSTRAINT IF EXISTS edges_to_node_fkey;
                    ALTER TABLE edges ADD CONSTRAINT edges_from_node_fkey
                        FOREIGN KEY (from_node) REFERENCES nodes(id) ON DELETE CASCADE;
                    ALTER TABLE edges ADD CONSTRAINT edges_to_node_fkey
                        FOREIGN KEY (to_node) REFERENCES nodes(id) ON DELETE CASCADE;
                    """
                )
            )


def ensure_graph_tables() -> None:
    ensure_repo()
    ensure_nodes()
    ensure_edges()


def get_repo_graph(repo_id: int) -> GraphPayload | None:
    ensure_graph_tables()

    with engine.begin() as connection:
        repo_exists = connection.execute(
            text("SELECT 1 FROM repos WHERE id = :repo_id"),
            {"repo_id": repo_id},
        ).scalar_one_or_none()
        if repo_exists is None:
            return None

        node_rows = connection.execute(
            text(
                """
                SELECT id, name, path, file_type
                FROM nodes
                WHERE repo_id = :repo_id
                ORDER BY path
                """
            ),
            {"repo_id": repo_id},
        ).mappings().all()

        if not node_rows:
            return None

        edge_rows = connection.execute(
            text(
                """
                SELECT from_node, to_node, relationship
                FROM edges
                WHERE repo_id = :repo_id
                ORDER BY from_node, to_node
                """
            ),
            {"repo_id": repo_id},
        ).mappings().all()

    nodes = [
        Node(
            id=row["id"],
            name=row["name"],
            path=row["path"],
            file_type=row["file_type"],
        )
        for row in node_rows
    ]
    edges = [
        Edge(
            source=row["from_node"],
            target=row["to_node"],
            type=row["relationship"] or "contains",
        )
        for row in edge_rows
    ]
    return GraphPayload(nodes=nodes, edges=edges)


def save_repo_graph(repo_id: int, owner: str, repo_name: str, graph: GraphPayload) -> None:
    ensure_graph_tables()

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                INSERT INTO repos (id, name, owner, last_updated)
                VALUES (:id, :name, :owner, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    owner = EXCLUDED.owner,
                    last_updated = NOW()
                """
            ),
            {"id": repo_id, "name": repo_name, "owner": owner},
        )

        connection.execute(
            text("DELETE FROM edges WHERE repo_id = :repo_id"),
            {"repo_id": repo_id},
        )
        connection.execute(
            text("DELETE FROM nodes WHERE repo_id = :repo_id"),
            {"repo_id": repo_id},
        )

        for node in graph.nodes:
            connection.execute(
                text(
                    """
                    INSERT INTO nodes (id, name, path, file_type, repo_id, updated_at)
                    VALUES (:id, :name, :path, :file_type, :repo_id, NOW())
                    """
                ),
                {
                    "id": node.id,
                    "name": node.name,
                    "path": node.path,
                    "file_type": node.file_type,
                    "repo_id": repo_id,
                },
            )

        for edge in graph.edges:
            connection.execute(
                text(
                    """
                    INSERT INTO edges (from_node, to_node, relationship, repo_id)
                    VALUES (:from_node, :to_node, :relationship, :repo_id)
                    ON CONFLICT (to_node, from_node) DO UPDATE SET
                        relationship = EXCLUDED.relationship,
                        repo_id = EXCLUDED.repo_id
                    """
                ),
                {
                    "from_node": edge.source,
                    "to_node": edge.target,
                    "relationship": edge.type,
                    "repo_id": repo_id,
                },
            )
