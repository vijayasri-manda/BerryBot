from fastapi import APIRouter
from app.config import settings
from app.services.ai_service import AIService

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "ai_provider": AIService.get_active_provider(),
        "supported_languages": settings.SUPPORTED_LANGUAGES,
        "version": "2.0.0"
    }
