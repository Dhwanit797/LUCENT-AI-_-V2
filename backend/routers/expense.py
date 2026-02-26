from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from backend.core.security import get_current_user
from backend.database import get_db
from backend.services.expense_service import get_expense_summary, get_expense_trend_data, upload_expense_csv, get_expense_status

router = APIRouter(prefix="/expense", tags=["expense"])

@router.get("/status")
def expense_status(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_expense_status(db)


@router.get("/summary")
def expense_summary(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_expense_summary(db)


@router.get("/trends")
def expense_trends(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_expense_trend_data(db)


@router.post("/upload-csv")
def upload_csv(file: UploadFile = File(...), user=Depends(get_current_user), db: Session = Depends(get_db)):
    return upload_expense_csv(file, db)

from backend.models.expense import ExpenseItem

@router.delete("/clear")
def clear_expense_data(user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        db.query(ExpenseItem).delete()
        db.commit()
        return {"message": "Data cleared successfully"}
    except Exception as e:
        db.rollback()
        return {"message": f"Error clearing data: {str(e)}"}
