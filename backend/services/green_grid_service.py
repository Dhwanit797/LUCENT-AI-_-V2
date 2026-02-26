import pandas as pd
from typing import List, Dict, Any
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from models.green_grid import GreenGridRecord
from services.data_quality_service import compute_data_quality


def get_green_grid_status(db: Session) -> Dict[str, Any]:
    count = db.query(GreenGridRecord).count()
    return {"has_data": count > 0, "row_count": count}


def get_green_grid_data(db: Session) -> Dict[str, Any]:
    records = db.query(GreenGridRecord).all()
    if not records:
        return {
            "current_usage_kwh": 0,
            "suggested_peak_shift": 0,
            "potential_savings_percent": 0,
            "recommendations": [],
        }

    usages = [r.usage_kwh for r in records]
    avg = round(sum(usages) / len(usages), 2) if usages else 0
    peak = round(max(usages), 2) if usages else 0
    savings = round(((peak - avg) / peak * 100) if peak > 0 else 0, 1)

    recs = []
    if savings > 10:
        recs.append("Shift heavy loads to off-peak hours")
    if avg > 50:
        recs.append("Consider energy-efficient equipment upgrades")
    recs.append("Monitor usage during identified peak windows")

    return {
        "current_usage_kwh": avg,
        "suggested_peak_shift": round(savings / 2, 1),
        "potential_savings_percent": savings,
        "recommendations": recs[:3],
    }


def get_energy_chart_data(db: Session) -> List[Dict[str, Any]]:
    records = db.query(GreenGridRecord).order_by(GreenGridRecord.id).all()
    if not records:
        return []
    return [{"hour": r.hour, "usage": round(r.usage_kwh, 2)} for r in records]


def upload_green_csv(file: UploadFile, db: Session) -> Dict[str, Any]:
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    try:
        df = pd.read_csv(file.file)
        required_cols = {"hour", "usage_kwh"}
        if not required_cols.issubset(df.columns):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(required_cols)}")

        quality = compute_data_quality(df, "energy_data")

        for _, row in df.iterrows():
            item = GreenGridRecord(hour=str(row["hour"]), usage_kwh=float(row["usage_kwh"]))
            db.add(item)
        db.commit()

        by_hour = df.groupby("hour")["usage_kwh"].mean()
        labels = by_hour.index.tolist()
        values = [round(v, 2) for v in by_hour.values.tolist()]
        average = round(sum(values) / len(values), 2) if values else 0.0

        return {"labels": labels, "values": values, "average": average, **quality}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")
