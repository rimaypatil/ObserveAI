import math
import uuid
from datetime import datetime, timezone
from typing import Optional, Sequence
from sqlalchemy import func, select
from backend.models.telemetry import TelemetryException, TelemetryLog, TelemetryMetric, TelemetryTrace
from backend.repositories.base import BaseRepository


class TelemetryLogRepository(BaseRepository[TelemetryLog]):
    def __init__(self, session):
        super().__init__(TelemetryLog, session)

    async def query_logs(
        self,
        project_id: uuid.UUID,
        service_id: Optional[uuid.UUID] = None,
        level: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        trace_id: Optional[str] = None,
        search_term: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Sequence[TelemetryLog]:
        query = select(TelemetryLog).where(
            TelemetryLog.project_id == project_id,
            TelemetryLog.is_deleted == False
        )
        if service_id:
            query = query.where(TelemetryLog.service_id == service_id)
        if level:
            query = query.where(TelemetryLog.level == level.upper())
        if start_time:
            query = query.where(TelemetryLog.timestamp >= start_time)
        if end_time:
            query = query.where(TelemetryLog.timestamp <= end_time)
        if trace_id:
            query = query.where(TelemetryLog.trace_id == trace_id)
        if search_term:
            query = query.where(TelemetryLog.message.ilike(f"%{search_term}%"))

        query = query.order_by(TelemetryLog.timestamp.desc()).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_errors_in_window(
        self,
        project_id: uuid.UUID,
        service_id: uuid.UUID,
        start_time: datetime,
        end_time: datetime
    ) -> int:
        query = select(func.count(TelemetryLog.id)).where(
            TelemetryLog.project_id == project_id,
            TelemetryLog.service_id == service_id,
            TelemetryLog.level.in_(["ERROR", "CRITICAL"]),
            TelemetryLog.timestamp >= start_time,
            TelemetryLog.timestamp <= end_time,
            TelemetryLog.is_deleted == False
        )
        result = await self.session.execute(query)
        return result.scalar_one()


class TelemetryExceptionRepository(BaseRepository[TelemetryException]):
    def __init__(self, session):
        super().__init__(TelemetryException, session)

    async def query_exceptions(
        self,
        project_id: uuid.UUID,
        service_id: Optional[uuid.UUID] = None,
        exception_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 50
    ) -> Sequence[TelemetryException]:
        query = select(TelemetryException).where(
            TelemetryException.project_id == project_id,
            TelemetryException.is_deleted == False
        )
        if service_id:
            query = query.where(TelemetryException.service_id == service_id)
        if exception_type:
            query = query.where(TelemetryException.exception_type == exception_type)
        if start_time:
            query = query.where(TelemetryException.timestamp >= start_time)
        if end_time:
            query = query.where(TelemetryException.timestamp <= end_time)

        query = query.order_by(TelemetryException.timestamp.desc()).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()


class TelemetryTraceRepository(BaseRepository[TelemetryTrace]):
    def __init__(self, session):
        super().__init__(TelemetryTrace, session)

    async def get_by_trace_id(self, project_id: uuid.UUID, trace_id: str) -> Sequence[TelemetryTrace]:
        query = select(TelemetryTrace).where(
            TelemetryTrace.project_id == project_id,
            TelemetryTrace.trace_id == trace_id,
            TelemetryTrace.is_deleted == False
        ).order_by(TelemetryTrace.timestamp.asc())
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_slow_spans(
        self,
        project_id: uuid.UUID,
        service_id: Optional[uuid.UUID] = None,
        min_duration_ms: float = 1000.0,
        limit: int = 50
    ) -> Sequence[TelemetryTrace]:
        query = select(TelemetryTrace).where(
            TelemetryTrace.project_id == project_id,
            TelemetryTrace.duration_ms >= min_duration_ms,
            TelemetryTrace.is_deleted == False
        )
        if service_id:
            query = query.where(TelemetryTrace.service_id == service_id)
        query = query.order_by(TelemetryTrace.duration_ms.desc()).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_latency_timeseries(
        self,
        project_id: uuid.UUID,
        start_time: datetime,
        end_time: datetime,
        bucket_minutes: int = 5
    ) -> Sequence[dict]:
        query = select(
            TelemetryTrace.timestamp,
            TelemetryTrace.duration_ms
        ).where(
            TelemetryTrace.project_id == project_id,
            TelemetryTrace.timestamp >= start_time,
            TelemetryTrace.timestamp <= end_time,
            TelemetryTrace.is_deleted == False
        ).order_by(TelemetryTrace.timestamp.asc())

        result = await self.session.execute(query)
        rows = result.all()
        if not rows:
            return []

        bucket_seconds = bucket_minutes * 60
        buckets = {}
        for ts, duration in rows:
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            epoch = ts.timestamp()
            bucket_epoch = math.floor(epoch / bucket_seconds) * bucket_seconds
            bucket_dt = datetime.fromtimestamp(bucket_epoch, tz=timezone.utc)
            if bucket_dt not in buckets:
                buckets[bucket_dt] = []
            buckets[bucket_dt].append(duration)

        res = []
        for bucket_dt in sorted(buckets.keys()):
            durations = sorted(buckets[bucket_dt])
            n = len(durations)
            p50_idx = min(int(round((n - 1) * 0.50)), n - 1)
            p95_idx = min(int(round((n - 1) * 0.95)), n - 1)
            p99_idx = min(int(round((n - 1) * 0.99)), n - 1)
            p50 = round(float(durations[p50_idx]), 2)
            p95 = round(float(durations[p95_idx]), 2)
            p99 = round(float(durations[p99_idx]), 2)
            res.append({
                "timestamp": bucket_dt.isoformat(),
                "p50_ms": p50,
                "p95_ms": p95,
                "p99_ms": p99
            })
        return res

    async def get_throughput_timeseries(
        self,
        project_id: uuid.UUID,
        start_time: datetime,
        end_time: datetime,
        bucket_minutes: int = 5
    ) -> Sequence[dict]:
        trace_query = select(
            TelemetryTrace.timestamp,
            TelemetryTrace.status_code
        ).where(
            TelemetryTrace.project_id == project_id,
            TelemetryTrace.timestamp >= start_time,
            TelemetryTrace.timestamp <= end_time,
            TelemetryTrace.is_deleted == False
        )

        log_query = select(
            TelemetryLog.timestamp,
            TelemetryLog.level
        ).where(
            TelemetryLog.project_id == project_id,
            TelemetryLog.timestamp >= start_time,
            TelemetryLog.timestamp <= end_time,
            TelemetryLog.is_deleted == False
        )

        trace_rows = (await self.session.execute(trace_query)).all()
        log_rows = (await self.session.execute(log_query)).all()

        if not trace_rows and not log_rows:
            return []

        bucket_seconds = bucket_minutes * 60
        buckets = {}

        def get_bucket_dt(ts):
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            epoch = ts.timestamp()
            bucket_epoch = math.floor(epoch / bucket_seconds) * bucket_seconds
            return datetime.fromtimestamp(bucket_epoch, tz=timezone.utc)

        for ts, status_code in trace_rows:
            b_dt = get_bucket_dt(ts)
            if b_dt not in buckets:
                buckets[b_dt] = {"req": 0, "err": 0}
            buckets[b_dt]["req"] += 1
            if status_code and status_code >= 400:
                buckets[b_dt]["err"] += 1

        for ts, level in log_rows:
            b_dt = get_bucket_dt(ts)
            if b_dt not in buckets:
                buckets[b_dt] = {"req": 0, "err": 0}
            if level in ["ERROR", "CRITICAL"]:
                buckets[b_dt]["err"] += 1
            if not trace_rows:
                buckets[b_dt]["req"] += 1

        res = []
        for b_dt in sorted(buckets.keys()):
            res.append({
                "timestamp": b_dt.isoformat(),
                "request_count": buckets[b_dt]["req"],
                "error_count": buckets[b_dt]["err"]
            })
        return res


class TelemetryMetricRepository(BaseRepository[TelemetryMetric]):
    def __init__(self, session):
        super().__init__(TelemetryMetric, session)

    async def query_metrics(
        self,
        project_id: uuid.UUID,
        metric_name: str,
        service_id: Optional[uuid.UUID] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 500
    ) -> Sequence[TelemetryMetric]:
        query = select(TelemetryMetric).where(
            TelemetryMetric.project_id == project_id,
            TelemetryMetric.name == metric_name,
            TelemetryMetric.is_deleted == False
        )
        if service_id:
            query = query.where(TelemetryMetric.service_id == service_id)
        if start_time:
            query = query.where(TelemetryMetric.timestamp >= start_time)
        if end_time:
            query = query.where(TelemetryMetric.timestamp <= end_time)

        query = query.order_by(TelemetryMetric.timestamp.asc()).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()
