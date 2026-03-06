from pydantic import BaseModel
from app.schemas.node import GraphPayload

class IngestionRequest(BaseModel):
    """ Request model """
    owner: str
    repo: str
    graph: GraphPayload


class IngestionResponse(BaseModel):
    message: str
    status: str
    thread_id: str
    chunks_processed: int = 0


    