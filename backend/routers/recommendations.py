from fastapi import APIRouter, Depends
from backend.core.security import get_current_user
from backend.services.recommendation_engine import (
    get_fraud_recommendations,
    get_expense_recommendations,
    get_inventory_recommendations,
    get_green_grid_recommendations,
)
from backend.services.recommendations_service import get_recommendations

router = APIRouter(tags=["recommendations"])


# Legacy general recommendations endpoint
@router.get("/recommendations")
def recommendations(user=Depends(get_current_user)):
    return get_recommendations()


# Module-specific recommendation endpoints
@router.get("/fraud/recommendations")
def fraud_recommendations(user=Depends(get_current_user)):
    return get_fraud_recommendations()


@router.get("/expense/recommendations")
def expense_recommendations(user=Depends(get_current_user)):
    return get_expense_recommendations()


@router.get("/inventory/recommendations")
def inventory_recommendations(user=Depends(get_current_user)):
    return get_inventory_recommendations()


@router.get("/green-grid/recommendations")
def green_grid_recommendations(user=Depends(get_current_user)):
    return get_green_grid_recommendations()
