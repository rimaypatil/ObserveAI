import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class SearchQuery(BaseModel):
    query: Optional[str] = None
    project_id: Optional[uuid.UUID] = None
    service_name: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    page: int = 1
    page_size: int = 20
    sort_by: str = "created_at"
    sort_order: str = "desc"


class SearchResultItem(BaseModel):
    id: uuid.UUID
    entity_type: str  # log, incident, rca, knowledge, project
    title: str
    description: Optional[str] = None
    project_id: Optional[uuid.UUID] = None
    created_at: Any


class SearchResponse(BaseModel):
    items: List[SearchResultItem]
    total: int
    page: int
    page_size: int
