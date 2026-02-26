from fastapi import APIRouter, Depends
from core.security import get_current_user
from services.carbon_service import get_carbon_estimate

router = APIRouter(prefix="/carbon", tags=["carbon"])


@router.get("/estimate")
def carbon_estimate(user=Depends(get_current_user)):
    return get_carbon_estimate()
