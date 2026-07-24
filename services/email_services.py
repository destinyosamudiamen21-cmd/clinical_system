import resend
from config.config import config

resend.api_key = config.RESEND_API_KEY

def send_reset_email(to_email: str, reset_link: str):
    resend.Emails.send({
        "from": config.MAIL_FROM,
        "to": to_email,
        "subject": "Reset your password",
        "html": f"""
            <p>You requested a password reset.</p>
            <p>Click the link below to set a new password. It expires in 1 hour.</p>
            <p><a href="{reset_link}">Reset my password</a></p>
            <p>If you didn't request this, ignore this email.</p>
        """,
    })
