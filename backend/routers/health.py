from fastapi import APIRouter, Depends
from core.security import get_current_user
from services.health_score_service import get_health_score

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/score")
def health_score(user=Depends(get_current_user)):
    return get_health_score()
