import os
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    # Core App Settings
    APP_NAME: str = "ObserveAI Platform"
    APP_ENV: str = Field(default="development", description="development | staging | production")
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(default="super-secret-production-key-change-in-env-32bytes", min_length=16)

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS_COUNT: int = 4

    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://app.observeai.io"
    ]

    # Supabase PostgreSQL Cloud Database Settings
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/observeai_db",
        description="Supabase PostgreSQL Cloud connection string (postgresql+asyncpg://...)"
    )
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800  # Recycles connections every 30 minutes for Supabase/PgBouncer
    DB_ECHO: bool = False

    @staticmethod
    def _sanitize_db_url(raw_url: str) -> str:
        raw_url = raw_url.strip()
        if "://" not in raw_url:
            return raw_url

        scheme, rest = raw_url.split("://", 1)
        if "@" in rest:
            last_at_idx = rest.rfind("@")
            user_pass = rest[:last_at_idx]
            host_part = rest[last_at_idx + 1:]
            if ":" in user_pass:
                user, password = user_pass.split(":", 1)
                password_encoded = password.replace("@", "%40")
                rest = f"{user}:{password_encoded}@{host_part}"
        return f"{scheme}://{rest}"

    @property
    def async_database_url(self) -> str:
        url = self._sanitize_db_url(self.DATABASE_URL)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def sync_database_url(self) -> str:
        url = self._sanitize_db_url(self.DATABASE_URL)
        if url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql+asyncpg://", "postgresql://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql://", 1)
        return url

    # Vector Database Settings (ChromaDB)
    CHROMADB_HOST: str = "localhost"
    CHROMADB_PORT: int = 8000
    CHROMADB_PATH: str = "./data/chromadb"
    CHROMADB_PERSIST_DIRECTORY: str = "./data/chromadb"
    CHROMADB_COLLECTION_PREFIX: str = "observeai"
    CHROMADB_IS_REMOTE: bool = False

    # Cache Settings (Redis)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    REDIS_POOL_SIZE: int = 20
    DEFAULT_CACHE_TTL: int = 300  # 5 minutes

    @property
    def redis_url(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Message Queue Settings (RabbitMQ)
    RABBITMQ_HOST: str = "localhost"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = "guest"
    RABBITMQ_PASSWORD: str = "guest"
    RABBITMQ_VHOST: str = "/"
    RABBITMQ_TELEMETRY_EXCHANGE: str = "telemetry.exchange"
    RABBITMQ_TELEMETRY_QUEUE: str = "telemetry.raw.queue"
    RABBITMQ_INCIDENT_QUEUE: str = "incidents.queue"
    RABBITMQ_AI_RCA_QUEUE: str = "ai.rca.queue"
    RABBITMQ_EMBEDDING_QUEUE: str = "embeddings.queue"
    RABBITMQ_NOTIFICATION_QUEUE: str = "notifications.queue"
    RABBITMQ_DLX_EXCHANGE: str = "dlx.exchange"
    RABBITMQ_DLQ: str = "dead_letter.queue"

    @property
    def rabbitmq_url(self) -> str:
        return f"amqp://{self.RABBITMQ_USER}:{self.RABBITMQ_PASSWORD}@{self.RABBITMQ_HOST}:{self.RABBITMQ_PORT}/{self.RABBITMQ_VHOST.lstrip('/')}"

    # AI & LLM Settings
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key")
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_TEMPERATURE: float = 0.2
    GEMINI_MAX_TOKENS: int = 4096

    # Embeddings & RAG Settings
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    RAG_TOP_K: int = 5
    RAG_SIMILARITY_THRESHOLD: float = 0.65
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150

    # Ingestion & SDK Settings
    INGESTION_MAX_BATCH_SIZE: int = 500
    INGESTION_MAX_PAYLOAD_MB: int = 10
    RATE_LIMIT_SDK_PER_MINUTE: int = 10000
    RATE_LIMIT_API_PER_MINUTE: int = 300

    # Auth & JWT Settings
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Notification & SMTP Settings
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: str = "alerts@observeai.io"
    EMAILS_FROM_NAME: str = "ObserveAI Alerts"

    # Observability
    PROMETHEUS_ENABLED: bool = True


settings = Settings()
