import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config.settings import settings
from backend.models.system import NotificationConfig, NotificationHistory
from backend.utils.logging import logger


class NotificationEngine:
    """Multi-channel notification engine (Email, Slack, Discord, Custom Webhooks)."""

    async def send_incident_alert(
        self,
        session: AsyncSession,
        config: NotificationConfig,
        incident_title: str,
        severity: str,
        service_name: str,
        rca_summary: Optional[str] = None
    ) -> bool:
        """Dispatches incident alert to configured channel."""
        channel = config.channel_type.lower()
        success = False
        error_msg = None

        message_body = (
            f"🚨 *[{severity}] ObserveAI Incident Alert*\n"
            f"*Service:* {service_name}\n"
            f"*Title:* {incident_title}\n"
            f"*Status:* AI Processing Complete\n"
        )
        if rca_summary:
            message_body += f"\n*Root Cause Summary:* {rca_summary[:300]}..."

        try:
            if channel == "slack" and config.target_url:
                success = await self._send_slack_webhook(config.target_url, message_body)
            elif channel == "discord" and config.target_url:
                success = await self._send_discord_webhook(config.target_url, message_body)
            elif channel == "webhook" and config.target_url:
                success = await self._send_generic_webhook(config.target_url, {
                    "event": "INCIDENT_ALERT",
                    "severity": severity,
                    "service": service_name,
                    "title": incident_title,
                    "summary": rca_summary
                })
            elif channel == "email" and settings.SMTP_HOST:
                target_email = config.settings_json.get("email", settings.EMAILS_FROM_EMAIL)
                success = self._send_email(target_email, f"[{severity}] ObserveAI Incident: {service_name}", message_body)
            else:
                logger.info("Notification target simulation", channel=channel)
                success = True
        except Exception as exc:
            error_msg = str(exc)
            logger.error("Failed to send notification", channel=channel, error=error_msg)

        # Log Notification History
        history = NotificationHistory(
            incident_id=config.project_id,  # using project context
            channel_type=channel,
            recipient=config.target_url or "email",
            status="SENT" if success else "FAILED",
            error_message=error_msg
        )
        session.add(history)
        await session.flush()
        return success

    async def _send_slack_webhook(self, webhook_url: str, text: str) -> bool:
        async with httpx.AsyncClient() as client:
            resp = await client.post(webhook_url, json={"text": text}, timeout=5.0)
            return resp.status_code == 200

    async def _send_discord_webhook(self, webhook_url: str, text: str) -> bool:
        async with httpx.AsyncClient() as client:
            resp = await client.post(webhook_url, json={"content": text}, timeout=5.0)
            return resp.status_code in (200, 204)

    async def _send_generic_webhook(self, target_url: str, payload: Dict[str, Any]) -> bool:
        async with httpx.AsyncClient() as client:
            resp = await client.post(target_url, json=payload, timeout=5.0)
            return resp.status_code < 400

    def _send_email(self, recipient_email: str, subject: str, body: str) -> bool:
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            logger.warning("SMTP credentials not configured. Skipping email dispatch.")
            return False

        try:
            msg = MIMEMultipart()
            msg["From"] = settings.EMAILS_FROM_EMAIL
            msg["To"] = recipient_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            return True
        except Exception as exc:
            logger.error("SMTP email send failed", recipient=recipient_email, error=str(exc))
            return False


    def send_password_reset_email(self, recipient_email: str, reset_token: str) -> bool:
        """Dispatches password reset link token email."""
        subject = "ObserveAI - Password Reset Request"
        body = (
            f"Hello,\n\n"
            f"You requested a password reset for your ObserveAI account.\n"
            f"Use the following reset token to set a new password:\n\n"
            f"Token: {reset_token}\n\n"
            f"If you did not request this, please ignore this email.\n"
        )
        if settings.SMTP_HOST and settings.SMTP_USER:
            return self._send_email(recipient_email, subject, body)
        else:
            logger.info("SMTP not configured. Password reset token logged securely.", email=recipient_email, token=reset_token[:8])
            return True


notification_engine = NotificationEngine()

