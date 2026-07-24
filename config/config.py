from pydantic_settings import BaseSettings, SettingsConfigDict


class Setting(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file= ".env",
        extra="ignore"
    )

    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str          # required — your gmail address
    MAIL_PASSWORD: str          # required — the App Password (SECRET)
    MAIL_FROM: str              # required — the from address
    FRONTEND_URL: str = "http://127.0.0.1:8000"   # base for building reset links


config = Setting()

