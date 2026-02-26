from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.security import get_current_user
from backend.database import get_db
from backend.services.unified_risk_service import compute_unified_risk_index


router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/unified")
def unified_risk(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return compute_unified_risk_index(db)

