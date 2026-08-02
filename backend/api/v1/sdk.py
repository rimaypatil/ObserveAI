from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import get_current_project_by_api_key
from backend.database.session import get_async_session
from backend.models.projects import Project
from backend.repositories.project_repository import ApiKeyRepository
from backend.schemas.common import APIResponse
from backend.schemas.telemetry import IngestPayloadSchema
from backend.ingestion.service import ingestion_service
from backend.utils.exceptions import AuthenticationError
from backend.utils.security import hash_api_key

router = APIRouter(prefix="/sdk", tags=["SDK Ingestion Engine"])


@router.post("/ingest", response_model=APIResponse[dict], status_code=status.HTTP_202_ACCEPTED)
async def ingest_telemetry(
    payload: IngestPayloadSchema,
    x_api_key: str = Header(None, alias="X-API-Key"),
    session: AsyncSession = Depends(get_async_session)
):
    """
    High-Throughput SDK Telemetry Ingestion Endpoint.
    Ingests logs, exceptions, traces, metrics, and deployments from customer microservices.
    """
    raw_key = x_api_key or payload.api_key
    if not raw_key:
        raise AuthenticationError("API Key required in X-API-Key header or payload body.")

    key_hash = hash_api_key(raw_key)
    key_repo = ApiKeyRepository(session)
    api_key_record = await key_repo.get_by_key_hash(key_hash)

    if not api_key_record or not api_key_record.is_active:
        raise AuthenticationError("Invalid or revoked SDK API Key.")

    project_id = api_key_record.project_id

    # Process ingestion & evaluate real-time incident detector
    result = await ingestion_service.process_telemetry_batch(
        session=session,
        project_id=project_id,
        payload=payload.model_dump()
    )

    return APIResponse(
        message="Telemetry batch accepted and queued for analysis.",
        data=result
    )
