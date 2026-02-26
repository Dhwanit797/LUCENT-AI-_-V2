from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from backend.core.security import get_current_user
from backend.database import get_db
from backend.services.inventory_service import get_inventory_summary, get_inventory_forecast, process_inventory_csv, get_inventory_status
from backend.services.recommendation_engine import get_inventory_recommendations

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/status")
def inventory_status(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_inventory_status(db)

@router.post("/upload-csv")
def upload_inventory_csv(file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    return process_inventory_csv(file, db)

@router.get("/summary")
def inventory_summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_inventory_summary(db)


@router.get("/forecast")
def inventory_forecast(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_inventory_forecast(db)


@router.get("/recommendations")
def inventory_recommendations(user=Depends(get_current_user)):
    return get_inventory_recommendations()

from backend.models.inventory import InventoryItem

@router.delete("/clear")
def clear_inventory_data(user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        db.query(InventoryItem).delete()
        db.commit()
        return {"message": "Data cleared successfully"}
    except Exception as e:
        db.rollback()
        return {"message": f"Error clearing data: {str(e)}"}
