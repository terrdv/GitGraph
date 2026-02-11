from pydantic import BaseModel

class GeminiAnalysisRequest(BaseModel):
    file_name: str
    path: str
    file_type: str
    code: str

class GeminiSummaryRequest(BaseModel):
    file_name: str
    summary: str
    path: str
