import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import get_current_user
from backend.database.session import get_async_session
from backend.models.users import User
from backend.schemas.common import APIResponse
from backend.schemas.knowledge import KnowledgeDocumentCreate, KnowledgeDocumentResponse, RAGQuerySchema
from backend.services.knowledge_service import knowledge_service

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base & Enterprise RAG"])


@router.post("/upload", response_model=APIResponse[KnowledgeDocumentResponse])
async def upload_document(
    project_id: uuid.UUID,
    data: KnowledgeDocumentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Uploads runbooks, architecture docs, or playbooks. Automatically chunks, embeds, and indexes into ChromaDB."""
    doc = await knowledge_service.ingest_document(session, project_id, data)
    return APIResponse(
        message="Document uploaded, chunked, embedded, and indexed into ChromaDB vectorstore.",
        data=KnowledgeDocumentResponse.model_validate(doc)
    )


@router.get("/documents", response_model=APIResponse[List[KnowledgeDocumentResponse]])
async def list_documents(
    project_id: uuid.UUID = Query(...),
    doc_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Lists indexed knowledge documents for a project."""
    docs = await knowledge_service.list_documents(session, project_id, doc_type=doc_type)
    return APIResponse(
        message="Indexed documents list retrieved.",
        data=[KnowledgeDocumentResponse.model_validate(d) for d in docs]
    )


@router.post("/search", response_model=APIResponse[dict])
async def search_rag_knowledge(
    project_id: uuid.UUID,
    data: RAGQuerySchema,
    current_user: User = Depends(get_current_user)
):
    """Executes RAG hybrid similarity query over ChromaDB knowledge collections."""
    result = knowledge_service.search_rag_knowledge(
        project_id=project_id,
        query=data.query,
        service_name=data.service_name,
        severity=data.severity,
        top_k=data.top_k
    )
    return APIResponse(
        message="RAG search completed.",
        data=result
    )
