import logging
from abc import ABC, abstractmethod
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("gowow.email")


class EmailSender(ABC):
    """Abstract interface for transactional email delivery."""

    @abstractmethod
    def send_email(self, to_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
        """Send a transactional email."""
        pass

    @abstractmethod
    def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        """Send password reset instructions containing secure reset token."""
        pass


class ConsoleEmailSender(EmailSender):
    """
    Console/Log-based email sender for local development and automated testing.
    Outputs structured reset logs to allow engineers and test suites to retrieve tokens safely.
    """

    def send_email(self, to_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
        logger.info(
            f"[DEV_EMAIL] To: {to_email} | Subject: {subject} | Content: {text_content}"
        )
        return True

    def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        subject = "GoWow Password Reset Instructions"
        body = (
            f"Hello,\n\n"
            f"You requested to reset your password on the GoWow Accessible Examination Platform.\n"
            f"Use the following password reset token to complete your request:\n\n"
            f"{reset_token}\n\n"
            f"This single-use token expires in 15 minutes.\n"
            f"If you did not request this, please disregard this message."
        )
        logger.info(
            f"[DEV_EMAIL_PASSWORD_RESET] To: {to_email} | ResetToken: {reset_token}"
        )
        return self.send_email(to_email, subject, body)


class ProductionEmailSender(EmailSender):
    """
    Production email sender. Strictly requires valid SMTP or cloud email provider credentials.
    Refuses to fake email delivery in production.
    """

    def __init__(self):
        # In a full production deployment, configure SMTP_HOST / SENDGRID_API_KEY / AWS_SES
        # If not configured, raise explicit runtime error to prevent silent email drops.
        pass

    def send_email(self, to_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
        raise RuntimeError(
            "Production email service is not configured. Please configure an approved SMTP, SendGrid, or AWS SES provider."
        )

    def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        raise RuntimeError(
            "Production email service is not configured. Please configure an approved SMTP, SendGrid, or AWS SES provider."
        )


def get_email_sender() -> EmailSender:
    """Factory function returning the environment-appropriate EmailSender."""
    if settings.ENVIRONMENT.lower() == "production":
        return ProductionEmailSender()
    return ConsoleEmailSender()
