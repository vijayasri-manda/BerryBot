import os
from typing import List, Dict, Any
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Berry Bot AI Interview Platform"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "berry-bot-super-secure-production-jwt-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database: Default to sqlite file in backend/berry_bot.db; PostgreSQL compatible via DATABASE_URL
    DATABASE_URL: str = "sqlite:///./berry_bot.db"

    # AI Providers (Configurable)
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    AI_PROVIDER_DEFAULT: str = "auto"  # 'gemini', 'openai', 'groq', 'heuristic_demo'

    # Uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx"]

    # Supported Languages
    SUPPORTED_LANGUAGES: Dict[str, str] = {
        "en": "English",
        "te": "Telugu (తెలుగు)",
        "hi": "Hindi (हिन्दी)",
        "ta": "Tamil (தமிழ்)",
        "kn": "Kannada (ಕನ್ನಡ)"
    }

    # Default Evaluation Rubric Weights
    DEFAULT_RUBRIC_WEIGHTS: Dict[str, float] = {
        "technical_correctness": 0.30,
        "relevance": 0.20,
        "depth_of_understanding": 0.20,
        "problem_solving": 0.20,
        "clarity_of_explanation": 0.10,
    }

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
