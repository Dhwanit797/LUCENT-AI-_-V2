from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any, Dict, Optional

from backend.core.security import get_current_user
from backend.services.business_assistant import generate_business_response

router = APIRouter(prefix="/ai", tags=["ai"])


class AskRequest(BaseModel):
    question: str
    module_data: Optional[Dict[str, Any]] = None


@router.post("/ask")
def ai_ask(req: AskRequest, user=Depends(get_current_user)):
    return generate_business_response(req.question, req.module_data)
