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

    RESEND_API_KEY: str
    MAIL_FROM: str = "onboarding@resend.dev"



config = Setting()

