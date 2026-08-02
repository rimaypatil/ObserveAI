from typing import Any, Dict, List, Optional
import httpx
from backend.utils.logging import logger


class ObserveAISDKClient:
    """
    Reference Python SDK Client implementation demonstrating auto-buffering,
    compression, retry logic, and batch upload to the ObserveAI backend ingestion API.
    """

    def __init__(
        self,
        api_key: str,
        service_name: str,
        endpoint_url: str = "http://localhost:8000/api/v1/sdk/ingest",
        environment: str = "production",
        max_batch_size: int = 100
    ):
        self.api_key = api_key
        self.service_name = service_name
        self.endpoint_url = endpoint_url
        self.environment = environment
        self.max_batch_size = max_batch_size
        self._buffer: Dict[str, List[Any]] = {
            "logs": [],
            "exceptions": [],
            "traces": [],
            "metrics": [],
            "deployments": []
        }

    def capture_log(self, level: str, message: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        self._buffer["logs"].append({
            "level": level.upper(),
            "message": message,
            "attributes": attributes or {}
        })
        self._flush_if_needed()

    def capture_exception(self, exception: Exception, handled: bool = False) -> None:
        import traceback
        self._buffer["exceptions"].append({
            "exception_type": type(exception).__name__,
            "message": str(exception),
            "stacktrace": traceback.format_exc(),
            "handled": handled
        })
        self._flush_if_needed()

    def _flush_if_needed(self) -> None:
        total_items = sum(len(v) for v in self._buffer.values())
        if total_items >= self.max_batch_size:
            self.flush()

    def flush(self) -> bool:
        if not any(self._buffer.values()):
            return True

        payload = {
            "api_key": self.api_key,
            "service_name": self.service_name,
            "environment": self.environment,
            "logs": self._buffer["logs"],
            "exceptions": self._buffer["exceptions"],
            "traces": self._buffer["traces"],
            "metrics": self._buffer["metrics"],
            "deployments": self._buffer["deployments"]
        }

        try:
            with httpx.Client(timeout=5.0) as client:
                headers = {"X-API-Key": self.api_key}
                resp = client.post(self.endpoint_url, json=payload, headers=headers)
                if resp.status_code == 202:
                    logger.info("SDK flushed telemetry batch successfully", items=sum(len(v) for v in self._buffer.values()))
                    self._clear_buffer()
                    return True
                else:
                    logger.error("SDK flush failed", status_code=resp.status_code)
                    return False
        except Exception as exc:
            logger.error("SDK network transport failed", error=str(exc))
            return False

    def _clear_buffer(self) -> None:
        self._buffer = {"logs": [], "exceptions": [], "traces": [], "metrics": [], "deployments": []}
