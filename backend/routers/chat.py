from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from backend.core.security import get_current_user
from backend.database import get_db
from backend.services.business_assistant import generate_business_response
from backend.services.expense_service import get_expense_summary
from backend.services.fraud_service import get_fraud_insights
from backend.services.inventory_service import get_inventory_summary
from backend.services.green_grid_service import get_green_grid_data
from backend.services.health_score_service import get_health_score
from backend.services.carbon_service import get_carbon_estimate
from backend.services.recommendations_service import get_recommendations

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


@router.post("/message")
def chat_message(
    req: ChatRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # Gather real data from each module
    try:
        expense_data = get_expense_summary(db)
    except Exception:
        expense_data = None

    try:
        fraud_data = get_fraud_insights(db)
    except Exception:
        fraud_data = None

    try:
        inventory_data = get_inventory_summary(db)
    except Exception:
        inventory_data = None

    try:
        green_data = get_green_grid_data(db)
    except Exception:
        green_data = None

    try:
        health_data = get_health_score()
    except Exception:
        health_data = None

    try:
        carbon_data = get_carbon_estimate()
    except Exception:
        carbon_data = None

    try:
        recs_data = get_recommendations()
    except Exception:
        recs_data = []

    module_data = {
        "expense": expense_data,
        "fraud": fraud_data,
        "inventory": inventory_data,
        "green_grid": green_data,
        "health": health_data,
        "carbon": carbon_data,
        "recommendations": recs_data,
    }

    result = generate_business_response(req.message, module_data)

    return {"role": "assistant", "content": result.get("answer", "")}
