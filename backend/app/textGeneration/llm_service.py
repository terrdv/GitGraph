from app.core.config import settings






def stream_llm_response(query: str, thread_id: str, session_id: str):
    """
    Generator that yields streaming response chunks.
    """
    # 1. Setup Models & Embeddings
    openai_api_key = settings.OPENAI_API_KEY
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY must be set")

    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")


    # 2. Setup Vector Store as Retriever
    vector_store = PGVector(
        collection_name=thread_id,
        connection=settings.DATABASE_URL,
        embeddings=embeddings,
        use_jsonb=True,
    )
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
