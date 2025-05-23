from typing import List, Optional, Dict
from pydantic import BaseModel

class MessagePart(BaseModel):
    type: str
    text: str

class Message(BaseModel):
    role: str
    content: str
    parts: List[MessagePart]

class ChatRequest(BaseModel):
    id: str
    messages: List[Message]
    model: str

class Choice(BaseModel):
    index: int
    message: Dict[str, str]  # Contains role and content
    finish_reason: Optional[str]

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatResponse(BaseModel):
    id: str
    model: str
    created: int
    choices: List[Choice]
    usage: Usage 