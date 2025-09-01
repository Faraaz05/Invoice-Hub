from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    database_url: str = "sqlite:///./invoicehub.db"
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Admin credentials
    admin_email: str = "admin@invoicehub.com"
    admin_password: str = "admin123"
    admin_name: str = "System Administrator"
    
    # OCR and NLP settings
    together_api_key: str = ""
    
    # CORS settings
    allowed_origins: str = "http://localhost:8080,http://127.0.0.1:8080"
    
    @property
    def origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    class Config:
        env_file = ".env"

settings = Settings()
