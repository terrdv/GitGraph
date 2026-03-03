"""
Main orchestrator for repo ingestion.
"""
import os
from typing import Any, Dict
from app.core.config import settings
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings

from .helpers import NodeProcessor

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



    
    def ingest_node(owner: str, repo: str, path: str):

        chunks = self.processor.process_node

        vectors = self.embeddings.embedDocuments(chunks)

        return 


        


            





        

