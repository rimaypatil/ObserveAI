import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.incidents import Incident, RcaReport
from backend.models.knowledge import KnowledgeDocument
from backend.models.projects import Project
from backend.models.telemetry import TelemetryLog
from backend.schemas.search import SearchQuery, SearchResponse, SearchResultItem


class SearchService:
    async def search_all(self, session: AsyncSession, organization_id: uuid.UUID, params: SearchQuery) -> SearchResponse:
        results: List[SearchResultItem] = []
        term = f"%{params.query}%" if params.query else "%"

        # Get all projects belonging to caller's organization
        proj_stmt = select(Project.id).where(Project.organization_id == organization_id, Project.is_deleted == False)
        org_project_ids = list((await session.execute(proj_stmt)).scalars().all())

        if not org_project_ids:
            return SearchResponse(
                items=[],
                total=0,
                page=params.page,
                page_size=params.page_size
            )

        if params.project_id:
            if params.project_id not in org_project_ids:
                return SearchResponse(
                    items=[],
                    total=0,
                    page=params.page,
                    page_size=params.page_size
                )
            target_project_ids = [params.project_id]
        else:
            target_project_ids = org_project_ids

        # Search Incidents
        inc_stmt = select(Incident).where(
            Incident.is_deleted == False,
            Incident.project_id.in_(target_project_ids),
            or_(Incident.title.ilike(term), Incident.description.ilike(term))
        )
        if params.severity:
            inc_stmt = inc_stmt.where(Incident.severity == params.severity)
        if params.status:
            inc_stmt = inc_stmt.where(Incident.status == params.status)

        incidents = (await session.execute(inc_stmt.limit(params.page_size))).scalars().all()
        for inc in incidents:
            results.append(SearchResultItem(
                id=inc.id,
                entity_type="incident",
                title=inc.title,
                description=inc.description,
                project_id=inc.project_id,
                created_at=inc.created_at
            ))

        # Search Knowledge Documents
        k_stmt = select(KnowledgeDocument).where(
            KnowledgeDocument.is_deleted == False,
            KnowledgeDocument.project_id.in_(target_project_ids),
            KnowledgeDocument.title.ilike(term)
        )

        docs = (await session.execute(k_stmt.limit(params.page_size))).scalars().all()
        for doc in docs:
            results.append(SearchResultItem(
                id=doc.id,
                entity_type="knowledge",
                title=doc.title,
                description=f"Doc Type: {doc.doc_type}",
                project_id=doc.project_id,
                created_at=doc.created_at
            ))

        total = len(results)
        return SearchResponse(
            items=results,
            total=total,
            page=params.page,
            page_size=params.page_size
        )


search_service = SearchService()
