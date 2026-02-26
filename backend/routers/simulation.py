from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.security import get_current_user
from database import get_db
from services.simulation_service import run_simulation


class SimulationRequest(BaseModel):
    sales_growth_multiplier: float = Field(1.0, ge=0.5, le=2.0)
    expense_growth_multiplier: float = Field(1.0, ge=0.5, le=2.0)
    fraud_sensitivity: float = Field(1.0, ge=0.1, le=3.0)
    supplier_delay_factor: float = Field(1.0, ge=0.5, le=3.0)
    reorder_threshold_multiplier: float = Field(1.0, ge=0.5, le=3.0)


router = APIRouter(tags=["simulation"])


@router.post("/simulate")
def simulate(
    payload: SimulationRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Run a what-if simulation over the latest business snapshots.

    This endpoint never mutates underlying data; it operates on derived metrics only.
    """
    return run_simulation(
        db=db,
        sales_growth_multiplier=payload.sales_growth_multiplier,
        expense_growth_multiplier=payload.expense_growth_multiplier,
        fraud_sensitivity=payload.fraud_sensitivity,
        supplier_delay_factor=payload.supplier_delay_factor,
        reorder_threshold_multiplier=payload.reorder_threshold_multiplier,
    )

