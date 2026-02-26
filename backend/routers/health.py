from fastapi import APIRouter, Depends
from backend.core.security import get_current_user
from backend.services.health_score_service import get_health_score

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/score")
def health_score(user=Depends(get_current_user)):
    return get_health_score()
