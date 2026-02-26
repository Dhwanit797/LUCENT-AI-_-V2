from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from core.security import get_current_user
from database import get_db
from services.fraud_service import get_fraud_insights, get_fraud_chart_data, upload_fraud_csv, get_fraud_status
from services.explainability_engine import explain_transaction
from services.recommendation_engine import get_fraud_recommendations

router = APIRouter(prefix="/fraud", tags=["fraud"])

@router.get("/status")
def fraud_status(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_fraud_status(db)


@router.get("/insights")
def fraud_insights(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_fraud_insights(db)


@router.get("/chart")
def fraud_chart(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_fraud_chart_data(db)


@router.post("/upload-csv")
def upload_csv(file: UploadFile = File(...), user=Depends(get_current_user), db: Session = Depends(get_db)):
    return upload_fraud_csv(file, db)

from models.fraud import FraudRecord

@router.delete("/clear")
def clear_fraud_data(user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        db.query(FraudRecord).delete()
        db.commit()
        return {"message": "Data cleared successfully"}
    except Exception as e:
        db.rollback()
        return {"message": f"Error clearing data: {str(e)}"}


@router.get("/recommendations")
def fraud_recommendations(user=Depends(get_current_user)):
    return get_fraud_recommendations()


@router.get("/explain/{transaction_id}")
def explain_fraud(transaction_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    result = explain_transaction(transaction_id, db)
    if not result["found"]:
        raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found.")
    return result
