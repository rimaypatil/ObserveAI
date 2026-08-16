import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.embeddings.chunker import document_chunker
from backend.embeddings.generator import embedding_generator
from backend.models.knowledge import KnowledgeDocument
from backend.rag.pipeline import rag_pipeline
from backend.repositories.knowledge_repository import KnowledgeRepository
from backend.schemas.knowledge import KnowledgeDocumentCreate
from backend.utils.exceptions import ValidationException
from backend.utils.logging import logger
from backend.vectorstore.chroma_client import chroma_store


class KnowledgeService:
    """Manages document chunking, SHA-256 deduplication, vector store indexing, and RAG search."""

    async def ingest_document(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        organization_id: uuid.UUID,
        data: KnowledgeDocumentCreate
    ) -> KnowledgeDocument:
        from backend.api.dependencies import verify_project_ownership
        await verify_project_ownership(session, project_id, organization_id)

        file_hash = document_chunker.compute_hash(data.content)
        repo = KnowledgeRepository(session)

        # Check existing duplicate hash
        existing = await repo.get_by_hash(project_id, file_hash)
        if existing and existing.is_indexed:
            logger.info("Identical document content already indexed. Skipping.", title=data.title)
            return existing

        target_category = data.doc_type.lower()
        if target_category not in chroma_store.COLLECTIONS:
            target_category = "knowledge_base"

        # Chunk content
        metadata_base = {
            "project_id": str(project_id),
            "organization_id": str(organization_id),
            "title": data.title,
            "doc_type": data.doc_type
        }
        chunks = document_chunker.chunk_text(data.content, metadata_base)

        if not chunks:
            raise ValidationException("Document content is empty or unparseable.")

        # Batch Embeddings
        chunk_texts = [c["text"] for c in chunks]
        embeddings = embedding_generator.generate_batch_embeddings(chunk_texts)

        chunk_ids = [f"doc_{file_hash[:12]}_{idx}" for idx in range(len(chunks))]
        chunk_metadatas = [c["metadata"] for c in chunks]

        # Insert Vectors into ChromaDB
        chroma_store.add_documents(
            category=target_category,
            documents=chunk_texts,
            embeddings=embeddings,
            metadatas=chunk_metadatas,
            ids=chunk_ids
        )

        # Record in Postgres DB
        if existing:
            existing.version += 1
            existing.is_indexed = True
            existing.chunk_count = len(chunks)
            doc_model = existing
        else:
            doc_model = KnowledgeDocument(
                project_id=project_id,
                title=data.title,
                doc_type=data.doc_type,
                file_hash=file_hash,
                version=1,
                vector_collection=chroma_store.get_collection_name(target_category),
                is_indexed=True,
                chunk_count=len(chunks)
            )
            doc_model = await repo.create(doc_model)

        await session.flush()
        logger.info("Successfully indexed document into vectorstore", title=data.title, chunks=len(chunks))
        return doc_model

    async def list_documents(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        organization_id: uuid.UUID,
        doc_type: Optional[str] = None
    ) -> List[KnowledgeDocument]:
        from backend.api.dependencies import verify_project_ownership
        await verify_project_ownership(session, project_id, organization_id)
        repo = KnowledgeRepository(session)
        return list(await repo.list_by_project(project_id, doc_type=doc_type))

    async def search_rag_knowledge(
        self,
        session: AsyncSession,
        project_id: uuid.UUID,
        organization_id: uuid.UUID,
        query: str,
        service_name: Optional[str] = None,
        severity: Optional[str] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        from backend.api.dependencies import verify_project_ownership
        await verify_project_ownership(session, project_id, organization_id)
        return rag_pipeline.execute_rag(
            project_id=project_id,
            incident_title=query,
            service_name=service_name or "general",
            severity=severity,
            top_k=top_k,
            organization_id=organization_id
        )


knowledge_service = KnowledgeService()
