from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.security import get_current_user
from backend.database import get_db
from backend.services.revenue_intelligence_service import analyze_revenue_intelligence


router = APIRouter(prefix="/revenue", tags=["revenue"])


@router.get("/intelligence")
def revenue_intelligence(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return analyze_revenue_intelligence(db)

