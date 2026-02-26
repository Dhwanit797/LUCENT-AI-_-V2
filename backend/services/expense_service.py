import random
import pandas as pd
from typing import List, Dict, Any
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from models.expense import ExpenseItem
from services.data_quality_service import compute_data_quality


def get_expense_status(db: Session) -> Dict[str, Any]:
    count = db.query(ExpenseItem).count()
    return {"has_data": count > 0, "row_count": count}


def get_expense_summary(db: Session) -> Dict[str, Any]:
    items = db.query(ExpenseItem).all()
    if not items:
        return {"by_category": [], "total": 0, "trend": "stable", "trend_percent": 0}

    cat_map: Dict[str, float] = {}
    for item in items:
        cat_map[item.category] = cat_map.get(item.category, 0) + item.amount

    by_category = [{"name": k, "value": round(v, 2)} for k, v in sorted(cat_map.items(), key=lambda x: -x[1])]
    total = round(sum(cat_map.values()), 2)
    return {
        "by_category": by_category,
        "total": total,
        "trend": "stable",
        "trend_percent": 0,
    }


def get_expense_trend_data(db: Session) -> List[Dict[str, Any]]:
    items = db.query(ExpenseItem).all()
    if not items:
        return []
    month_map: Dict[str, float] = {}
    for item in items:
        month_map[item.month] = month_map.get(item.month, 0) + item.amount
    return [{"month": m, "amount": round(a, 2)} for m, a in sorted(month_map.items())]


def upload_expense_csv(file: UploadFile, db: Session) -> Dict[str, Any]:
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    try:
        df = pd.read_csv(file.file)
        required_cols = {"category", "amount", "month"}
        if not required_cols.issubset(df.columns):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(required_cols)}")

        quality = compute_data_quality(df, "expense_data")

        for _, row in df.iterrows():
            item = ExpenseItem(
                category=str(row["category"]),
                amount=float(row["amount"]),
                month=str(row["month"])
            )
            db.add(item)
        db.commit()

        by_category = df.groupby("category")["amount"].sum()
        labels = by_category.index.tolist()
        values = [round(v, 2) for v in by_category.values.tolist()]
        total = round(sum(values), 2)

        trends_df = df.groupby("month")["amount"].sum()
        trends = [{"month": str(m), "amount": round(float(a), 2)} for m, a in trends_df.items()]

        return {
            "labels": labels,
            "values": values,
            "total": total,
            "trends": trends,
            "trend": "stable",
            "trend_percent": 0.0,
            **quality,
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")
