import json
from typing import Any, Dict, Optional
import aio_pika
from aio_pika import ExchangeType, Message
from backend.config.settings import settings
from backend.utils.logging import logger


class RabbitMQManager:
    """Async RabbitMQ Producer & Consumer Manager for decoupled event processing."""

    def __init__(self):
        self.connection: Optional[aio_pika.RobustConnection] = None
        self.channel: Optional[aio_pika.RobustChannel] = None

    async def connect(self):
        if self.connection is None or self.connection.is_closed:
            try:
                self.connection = await aio_pika.connect_robust(settings.rabbitmq_url)
                self.channel = await self.connection.channel()
                await self.channel.set_qos(prefetch_count=100)
                await self._declare_exchanges_and_queues()
                logger.info("Connected to RabbitMQ message broker")
            except Exception as exc:
                logger.warning("RabbitMQ connection unavailable. Falling back to local async processing.", error=str(exc))

    async def _declare_exchanges_and_queues(self):
        if not self.channel:
            return

        # Dead Letter Exchange (DLX)
        dlx_exchange = await self.channel.declare_exchange(
            settings.RABBITMQ_DLX_EXCHANGE, ExchangeType.DIRECT, durable=True
        )
        dlq = await self.channel.declare_queue(settings.RABBITMQ_DLQ, durable=True)
        await dlq.bind(dlx_exchange, routing_key="dead_letter")

        # Telemetry Exchange & Main Queues
        exchange = await self.channel.declare_exchange(
            settings.RABBITMQ_TELEMETRY_EXCHANGE, ExchangeType.TOPIC, durable=True
        )

        queues = [
            settings.RABBITMQ_TELEMETRY_QUEUE,
            settings.RABBITMQ_INCIDENT_QUEUE,
            settings.RABBITMQ_AI_RCA_QUEUE,
            settings.RABBITMQ_EMBEDDING_QUEUE,
            settings.RABBITMQ_NOTIFICATION_QUEUE,
        ]

        for q_name in queues:
            q = await self.channel.declare_queue(
                q_name,
                durable=True,
                arguments={
                    "x-dead-letter-exchange": settings.RABBITMQ_DLX_EXCHANGE,
                    "x-dead-letter-routing-key": "dead_letter"
                }
            )
            routing_key = q_name.split(".")[0] + ".*"
            await q.bind(exchange, routing_key=routing_key)

    async def publish_message(self, queue_name: str, payload: Dict[str, Any]) -> bool:
        """Publishes a JSON payload to a target durable queue."""
        if not self.channel or self.channel.is_closed:
            await self.connect()

        if not self.channel:
            logger.warning("RabbitMQ unavailable. Skipping message queue publish.", queue=queue_name)
            return False

        try:
            message_body = json.dumps(payload).encode("utf-8")
            message = Message(
                body=message_body,
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json"
            )
            
            routing_key = queue_name.split(".")[0] + ".event"
            exchange = await self.channel.get_exchange(settings.RABBITMQ_TELEMETRY_EXCHANGE)
            await exchange.publish(message, routing_key=routing_key)
            logger.debug("Published message to RabbitMQ", queue=queue_name)
            return True
        except Exception as exc:
            logger.error("Failed to publish message to RabbitMQ", queue=queue_name, error=str(exc))
            return False


rabbitmq_manager = RabbitMQManager()
