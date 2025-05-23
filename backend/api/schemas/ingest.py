from typing import List, Optional
from pydantic import BaseModel

class ChunkMetadata(BaseModel):
    chunk_id: str
    text: str
    page_number: Optional[int]
    # Add other fields as needed

class IngestResponse(BaseModel):
    chunks: List[ChunkMetadata] 