from app.core.config import settings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_postgres import PGVector


def _initialize_models() -> tuple[ChatOpenAI, OpenAIEmbeddings]:
    openai_api_key = settings.OPENAI_API_KEY
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY must be set")

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-large",
        api_key=openai_api_key,
    )
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.2,
        api_key=openai_api_key,
    )
    return llm, embeddings


def stream_llm_response(query: str, thread_id: str, session_id: str):
    """
    Generator that yields streaming response chunks.
    """
    _ = session_id
    llm, embeddings = _initialize_models()
    prompt = _build_prompt(query=query, thread_id=thread_id, embeddings=embeddings)
    for chunk in llm.stream(prompt):
        if chunk.content:
            yield chunk.content


def get_llm_response(query: str, thread_id: str, session_id: str) -> str:
    """Run retrieval + completion and return a single assistant response."""
    _ = session_id
    llm, embeddings = _initialize_models()
    prompt = _build_prompt(query=query, thread_id=thread_id, embeddings=embeddings)
    response = llm.invoke(prompt)
    return response.content


def _build_prompt(query: str, thread_id: str, embeddings: OpenAIEmbeddings) -> str:
    """Build a grounded prompt from top-k retrieved chunks."""

    # Setup Vector Store as Retriever
    vector_store = PGVector(
        collection_name=thread_id,
        connection=settings.DATABASE_URL,
        embeddings=embeddings,
        use_jsonb=True,
    )
    retriever = vector_store.as_retriever(search_kwargs={"k": 10})
    retrieved_docs = retriever.invoke(query)

    context_blocks: list[str] = []
    for idx, doc in enumerate(retrieved_docs, start=1):
        metadata = doc.metadata or {}
        node_path = metadata.get("node_path", "unknown")
        chunk_index = metadata.get("chunk_index", "unknown")
        file_type = metadata.get("file_type", "unknown")
        context_blocks.append(
            "\n".join(
                [
                    f"[Chunk {idx}]",
                    f"File: {node_path}",
                    f"File type: {file_type}",
                    f"Chunk index: {chunk_index}",
                    "Content:",
                    doc.page_content,
                ]
            )
        )

    context = "\n\n".join(context_blocks)
    prompt = (
        "You are a codebase assistant. Answer using only the retrieved context when possible.\n"
        "When helpful, identify the files of most interest for the query and explain why.\n\n"
        "Do not use markdown"
        f"Query:\n{query}\n\n"
        f"Context:\n{context}"
    )
    return prompt
