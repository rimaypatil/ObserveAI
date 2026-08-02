import uuid
from typing import Optional, Sequence
from sqlalchemy import select
from backend.models.knowledge import KnowledgeDocument
from backend.repositories.base import BaseRepository


class KnowledgeRepository(BaseRepository[KnowledgeDocument]):
    def __init__(self, session):
        super().__init__(KnowledgeDocument, session)

    async def get_by_hash(self, project_id: uuid.UUID, file_hash: str) -> Optional[KnowledgeDocument]:
        query = select(KnowledgeDocument).where(
            KnowledgeDocument.project_id == project_id,
            KnowledgeDocument.file_hash == file_hash,
            KnowledgeDocument.is_deleted == False
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def list_by_project(
        self,
        project_id: uuid.UUID,
        doc_type: Optional[str] = None,
        is_indexed: Optional[bool] = None
    ) -> Sequence[KnowledgeDocument]:
        query = select(KnowledgeDocument).where(
            KnowledgeDocument.project_id == project_id,
            KnowledgeDocument.is_deleted == False
        )
        if doc_type:
            query = query.where(KnowledgeDocument.doc_type == doc_type)
        if is_indexed is not None:
            query = query.where(KnowledgeDocument.is_indexed == is_indexed)

        query = query.order_by(KnowledgeDocument.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()
