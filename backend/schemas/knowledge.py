import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class KnowledgeDocumentCreate(BaseModel):
    title: str = Field(..., min_length=2)
    doc_type: str = Field(..., description="runbook | architecture | postmortem | playbooks | docs")
    content: str = Field(..., min_length=10, description="Raw markdown or text content")
    category: Optional[str] = None
    tags: Optional[list[str]] = None


class UpdateKnowledgeDocumentRequest(BaseModel):
    title: Optional[str] = None
    doc_type: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None


class KnowledgeDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    doc_type: str
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    file_hash: str
    version: int
    vector_collection: str
    is_indexed: bool
    chunk_count: int
    created_at: datetime


class RAGQuerySchema(BaseModel):
    query: str
    service_name: Optional[str] = None
    severity: Optional[str] = None
    top_k: int = 5
