from pydantic import BaseModel


class Node(BaseModel):
    id: str
    name: str
    path: str
    file_type: str


class Edge(BaseModel):
    source: str
    target: str
    type: str = "contains"
    label: str | None = None


class GraphPayload(BaseModel):
    nodes: list[Node]
    edges: list[Edge]
    
    
