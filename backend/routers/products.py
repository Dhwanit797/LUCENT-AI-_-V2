from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.security import get_current_user
from database import get_db
from models.product import Product


router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
def list_products(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Return products with computed demand score."""
    products = db.query(Product).all()
    results = []

    for p in products:
        available = p.available_quantity or 0
        sold = p.total_sold or 0
        total = sold + available

        if total > 0:
            raw_demand = (sold / total) * 100.0
        else:
            raw_demand = 0.0

        demand = int(round(max(0.0, min(raw_demand, 100.0))))

        results.append(
            {
                "id": p.id,
                "name": p.name,
                "demand": demand,
                "available_quantity": available,
                "total_sold": sold,
            }
        )

    return results

