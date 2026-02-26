from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.security import get_current_user
from backend.database import get_db
from backend.models.product import Product


router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
def list_products(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Return products with demand score derived from inventory (low quantity = higher demand)."""
    products = db.query(Product).all()
    if not products:
        return []

    quantities = [p.available_quantity or 0 for p in products]
    max_qty = max(quantities)
    base_factor = max(1, int(round(max_qty * 0.25))) if max_qty > 0 else 1
    results = []

    for p in products:
        available = p.available_quantity or 0

        # Demand score from quantity: low quantity -> higher demand, high quantity -> lower demand (0-100)
        if max_qty > 0:
            demand = int(round(100.0 - min(100.0, (available / max_qty) * 100.0)))
        else:
            demand = 0

        # Total Sold derived deterministically from demand score + available quantity (no sales history in CSV).
        raw_sold = (demand / 100.0) * (available + base_factor)
        sold = int(round(raw_sold))
        if sold < 0:
            sold = 0

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

