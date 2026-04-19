import logging
import smtplib
from email.message import EmailMessage
import random
import string
from core.config import SMTP_EMAIL, SMTP_PASSWORD, SMTP_HOST, SMTP_PORT

logger = logging.getLogger(__name__)

def send_email_message(to_email: str, subject: str, body: str) -> None:
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.info(f"📧 [MOCK EMAIL] To: {to_email} | Subject: {subject}\n{body}\n")
        return
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg["Subject"] = subject
        msg["From"] = f"Subly <{SMTP_EMAIL}>"
        msg["To"] = to_email

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"📧 Sent email to {to_email}")
    except Exception as e:
        logger.error(f"Email send error: {e}")

def generate_verification_code() -> str:
    """Vygenerování náhodného 6místného kódu."""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(to_email: str, code: str) -> None:
    """Odeslání ověřovacího kódu na e-mail."""
    subject = "Subly – ověření e-mailu / Email Verification"
    body = (
        f"Váš ověřovací kód pro Subly je: {code}\n"
        f"Your Subly verification code is: {code}\n\n"
        f"Kód je platný 15 minut / Code is valid for 15 minutes."
    )
    send_email_message(to_email, subject, body)
