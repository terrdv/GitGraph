"""
Main orchestrator for repo ingestion.
"""
import os
from typing import Any

from app.core.config import settings
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
import logging

from .helpers import NodeProcessor

logger = logging.getLogger(__name__)

class RepositoryIngestionOrchestrator:
    """
    Handles the following pipeline:

    1. Authentication with GitHub API
    2. Fetch Repository content
    3. Process each file into chunks by token count
    4. Embedding
    5. Storage
    """


    def __init__(self, session):
        """
        Initialize Orchestrator

        Args: session
        """
        self.session = session
        self.processor = NodeProcessor(session)

        #Initialize Embeddings

        openai_api_key = settings.OPENAI_API_KEY
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY must be set")
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

        self.db_connection = settings.DATABASE_URL
        self.engine: Engine = create_engine(self.db_connection, pool_pre_ping=True)



    
    def _build_embedding_text(self, chunk_text: str, path: str) -> str:
        """Prefix each chunk with stable source path context for retrieval."""
        filename = os.path.basename(path) or path
        folder = os.path.dirname(path) or "."
        return (
            f"Repository path: {path}\n"
            f"Filename: {filename}\n"
            f"Folder: {folder}\n\n"
            f"{chunk_text}"
        )

    def ingest_node(self, owner: str, repo: str, path: str) -> list[Document]:

        chunks = self.processor.process_node(owner, repo, path)

        documents: list[Document] = []

        for chunk in chunks:
            metadata = chunk.metadata.to_dict()
            metadata["chunk_id"] = chunk.chunk_id
            metadata["chunk_index"] = chunk.chunk_index
            documents.append(
                Document(
                    page_content=self._build_embedding_text(chunk_text=chunk.text, path=path),
                    metadata=metadata,
                )
            )

        return documents

    def get_existing_embedding_count(self, owner: str, repo: str) -> int:
        """Return the number of stored embeddings for a repo collection."""
        collection_name = f"{owner}/{repo}"
        query = text(
            """
            SELECT COUNT(e.id)
            FROM langchain_pg_collection AS c
            JOIN langchain_pg_embedding AS e
              ON e.collection_id = c.uuid
            WHERE c.name = :collection_name
            """
        )
        with self.engine.begin() as connection:
            result = connection.execute(
                query,
                {"collection_name": collection_name},
            )
            count = result.scalar_one()
        return int(count or 0)

    def repo_embeddings_exist(self, owner: str, repo: str) -> bool:
        """Check whether the repo already has stored embeddings."""
        return self.get_existing_embedding_count(owner, repo) > 0

    def ingest_repo_tree(self, owner: str, repo: str, tree_payload: dict[str, Any]) -> int:
        """Ingest all file nodes from the /tree payload into one repo collection."""
        if self.repo_embeddings_exist(owner, repo):
            logger.info("Skipping ingestion for %s/%s; embeddings already exist.", owner, repo)
            return 0

        vector_store = PGVector(
            collection_name=f"{owner}/{repo}",
            connection=self.db_connection,
            embeddings=self.embeddings,
            use_jsonb=True,
        )

        nodes = tree_payload.get("nodes", [])
        total_documents = 0

        for node in nodes:
            node_path = node.get("path") if isinstance(node, dict) else getattr(node, "path", None)
            node_type = node.get("file_type") if isinstance(node, dict) else getattr(node, "file_type", None)

            if node_type != "blob" or not node_path:
                continue

            try:
                documents = self.ingest_node(owner, repo, node_path)
                if documents:
                    vector_store.add_documents(documents)
                    total_documents += len(documents)
            except Exception as exc:
                # Do not fail the full repo ingestion because one file is unreadable.
                logger.warning("Skipping file during ingestion: %s (%s)", node_path, exc)
                continue

        return total_documents
