from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.security import get_current_user
from database import get_db
from models.vendor import Vendor


router = APIRouter(prefix="/vendors", tags=["vendors"])


@router.get("")
def list_vendors(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Return vendors with computed 0–100 rating."""
    vendors = db.query(Vendor).all()
    results = []

    for v in vendors:
        delivery = (v.delivery_score or 0)
        quality = (v.quality_score or 0)
        price = (v.price_score or 0)

        raw_rating = (delivery * 0.4 + quality * 0.4 + price * 0.2) * 20
        rating = int(round(max(0.0, min(raw_rating, 100.0))))

        results.append(
            {
                "id": v.id,
                "name": v.name,
                "rating": rating,
            }
        )

    return results

