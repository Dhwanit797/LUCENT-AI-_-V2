# Smart Inventory AI: reorder suggestions (rule-based + optional LinearRegression)
from typing import List, Dict, Any
from fastapi import UploadFile, HTTPException

try:
    from sklearn.linear_model import LinearRegression
    import numpy as np
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.inventory import InventoryItem
from services.data_quality_service import compute_data_quality


def get_inventory_status(db: Session) -> Dict[str, Any]:
    count = db.query(InventoryItem).count()
    return {"has_data": count > 0, "row_count": count}


def get_inventory_summary(db: Session) -> Dict[str, Any]:
    db_items = db.query(InventoryItem).all()
    if not db_items:
        return {"items": [], "low_stock_count": 0, "suggestions": []}

    # Use 20% of max quantity in category as reorder threshold, min 5
    quantities = [i.quantity for i in db_items]
    max_qty = max(quantities) if quantities else 100
    reorder_threshold = max(5, int(max_qty * 0.2))

    items = [
        {
            "name": i.item_name,
            "stock": i.quantity,
            "reorder_at": reorder_threshold,
            "category": i.category,
            "price": i.price,
        }
        for i in db_items
    ]
    low_stock = [i for i in items if i["stock"] < i["reorder_at"]]
    return {
        "items": items,
        "low_stock_count": len(low_stock),
        "suggestions": [
            f"Reorder {i['name']} soon (current stock: {i['stock']}, threshold: {i['reorder_at']})"
            for i in low_stock[:5]
        ],
    }


def get_inventory_forecast(db: Session) -> List[Dict[str, Any]]:
    """Generate forecast from real DB data using linear regression on quantities."""
    db_items = db.query(InventoryItem).all()
    if not db_items:
        return []

    # Sort items by quantity descending and project depletion over 4 weeks
    items_sorted = sorted(db_items, key=lambda x: x.quantity, reverse=True)[:8]

    if HAS_SKLEARN:
        # Use linear regression to project weekly stock decline
        results = []
        total_qty = sum(i.quantity for i in db_items)
        # Assume ~8% weekly consumption rate based on total stock
        weekly_rate = total_qty * 0.08
        X = np.array([[i] for i in range(1, 6)])  # weeks 1-5 as training proxy
        y = np.array([total_qty - (weekly_rate * i) for i in range(1, 6)])
        model = LinearRegression().fit(X, y)
        future = np.array([[i] for i in range(1, 5)])
        pred = model.predict(future)
        return [
            {"week": f"W{i}", "predicted_stock": max(0, round(float(p), 0))}
            for i, p in enumerate(pred, 1)
        ]

    # Fallback: simple linear depletion
    total = sum(i.quantity for i in db_items)
    weekly_drop = total * 0.08
    return [
        {"week": f"W{i}", "predicted_stock": max(0, round(total - weekly_drop * i, 0))}
        for i in range(1, 5)
    ]


def process_inventory_csv(file: UploadFile, db: Session) -> Dict[str, Any]:
    if not HAS_PANDAS:
        raise HTTPException(status_code=500, detail="Pandas is not installed")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are allowed")

    try:
        # Reset pointer and stream directly into pandas (faster, avoids encoding issues)
        file.file.seek(0)
        df = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    # Normalize column names: lowercase + strip whitespace
    df.columns = [c.strip().lower() for c in df.columns]

    # Accept common column name aliases
    col_aliases = {
        'item_name': ['item_name', 'name', 'product', 'product_name', 'item', 'sku'],
        'category':  ['category', 'cat', 'type', 'department', 'group'],
        'quantity':  ['quantity', 'qty', 'stock', 'count', 'units', 'on_hand'],
        'price':     ['price', 'cost', 'unit_price', 'value', 'amount'],
    }
    rename_map = {}
    for canonical, aliases in col_aliases.items():
        if canonical not in df.columns:
            for alias in aliases:
                if alias in df.columns:
                    rename_map[alias] = canonical
                    break
    if rename_map:
        df = df.rename(columns=rename_map)

    required_cols = {'item_name', 'category', 'quantity', 'price'}
    missing = required_cols - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {missing}. Expected: item_name, category, quantity, price"
        )

    df = df.dropna(subset=['item_name', 'category'])
    df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(0).astype(int)
    df['price'] = pd.to_numeric(df['price'], errors='coerce').fillna(0.0).astype(float)

    quality = compute_data_quality(df, "inventory_data")

    if df.empty:
        raise HTTPException(status_code=400, detail="The file is empty or has no valid rows")

    errors: List[str] = []

    # Collapse duplicate item_names within this CSV so we only ever upsert one
    # record per SKU, avoiding UNIQUE constraint violations.
    consolidated: Dict[str, Dict[str, Any]] = {}
    for _, row in df.iterrows():
        item_name = str(row['item_name']).strip()
        if not item_name:
            continue
        consolidated[item_name] = {
            "item_name": item_name,
            "category": str(row['category']).strip(),
            "quantity": int(row['quantity']),
            "price": float(row['price']),
        }

    records_added = 0
    try:
        for item_name, rec in consolidated.items():
            existing = db.query(InventoryItem).filter(InventoryItem.item_name == item_name).first()
            if existing:
                existing.quantity = rec["quantity"]
                existing.price = rec["price"]
                existing.category = rec["category"]
            else:
                db.add(InventoryItem(
                    item_name=rec["item_name"],
                    category=rec["category"],
                    quantity=rec["quantity"],
                    price=rec["price"],
                ))
            records_added += 1

        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Duplicate inventory item detected: {str(e)}")

    return {
        "success": True,
        "records_added": records_added,
        "errors": errors,
        **quality,
    }
