import smtplib
from email.message import EmailMessage
from config.config import config

def send_reset_email(to_email: str, reset_link: str):
    msg = EmailMessage()
    msg["Subject"] = "Reset your password"
    msg["From"] = config.MAIL_FROM
    msg["To"] = to_email
    msg.set_content(
        f"You requested a password reset.\n\n"
        f"Click the link below to set a new password. It expires in 1 hour.\n\n"
        f"{reset_link}\n\n"
        f"If you didn't request this, ignore this email."
    )

    with smtplib.SMTP(config.MAIL_SERVER, config.MAIL_PORT) as server:
        server.starttls()
        server.login(config.MAIL_USERNAME, config.MAIL_PASSWORD)
        server.send_message(msg)
