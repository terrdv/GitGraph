"""
Main orchestrator for repo ingestion.
"""

class RepositoryIngestionOrchestrator:
    """
    Handles the following pipeline:

    1. Authentication with GitHub API
    2. Fetch Repository content
    3. Process each file into chunks by token count
    4. Storage and Embedding
    """


    def __init__(self, session):
        """
        Initialize Orchestrator

        Args: session
        """
        

