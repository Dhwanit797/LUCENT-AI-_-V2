# Centralized data ingestion orchestrator
import io
from typing import Dict, Any, Tuple

import pandas as pd
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from services.schema_validator import validate_schema, SCHEMAS
from services.data_normalizer import normalize
from models.expense import ExpenseItem
from models.fraud import FraudRecord
from models.inventory import InventoryItem
from models.green_grid import GreenGridRecord


def _store_expense(df: pd.DataFrame, db: Session) -> Tuple[int, int]:
    """Insert expense rows. Returns (processed, failed)."""
    processed = 0
    failed = 0
    for _, row in df.iterrows():
        try:
            item = ExpenseItem(
                category=str(row.get("category", "")),
                amount=float(row.get("amount", 0)),
                month=str(row.get("month", "")),
            )
            db.add(item)
            processed += 1
        except Exception:
            failed += 1
    return processed, failed


def _store_fraud(df: pd.DataFrame, db: Session) -> Tuple[int, int]:
    """Insert/merge fraud rows. Returns (processed, failed)."""
    processed = 0
    failed = 0
    for _, row in df.iterrows():
        try:
            item = FraudRecord(
                transaction_id=str(row.get("transaction_id", "")),
                amount=int(float(row.get("amount", 0))),
                is_fraud=bool(row.get("is_fraud", False)),
            )
            db.merge(item)
            processed += 1
        except Exception:
            failed += 1
    return processed, failed


def _store_inventory(df: pd.DataFrame, db: Session) -> Tuple[int, int]:
    """Insert/update inventory rows. Returns (processed, failed)."""
    processed = 0
    failed = 0
    for _, row in df.iterrows():
        try:
            item_name = str(row.get("item_name", "")).strip()
            if not item_name:
                failed += 1
                continue

            category = str(row.get("category", "")).strip()
            quantity = int(row.get("quantity", 0))
            price = float(row.get("price", 0.0))

            existing = db.query(InventoryItem).filter(
                InventoryItem.item_name == item_name
            ).first()

            if existing:
                existing.quantity = quantity
                existing.price = price
                existing.category = category
            else:
                db.add(InventoryItem(
                    item_name=item_name,
                    category=category,
                    quantity=quantity,
                    price=price,
                ))
            processed += 1
        except Exception:
            failed += 1
    return processed, failed


def _store_energy(df: pd.DataFrame, db: Session) -> Tuple[int, int]:
    """Insert energy/green-grid rows. Returns (processed, failed)."""
    processed = 0
    failed = 0
    for _, row in df.iterrows():
        try:
            item = GreenGridRecord(
                hour=str(row.get("hour", "")),
                usage_kwh=float(row.get("usage_kwh", 0)),
            )
            db.add(item)
            processed += 1
        except Exception:
            failed += 1
    return processed, failed


_STORE_FNS = {
    "expense_data": _store_expense,
    "fraud_data": _store_fraud,
    "inventory_data": _store_inventory,
    "energy_data": _store_energy,
}


def _compute_data_quality(
    df: pd.DataFrame,
    dataset_type: str,
    schema_name: str,
) -> Dict[str, Any]:
    """
    Compute a lightweight data quality score (0–100) plus breakdown.

    Components:
      - missing value %
      - duplicate row %
      - schema mismatch penalty (required vs legacy)
      - outlier penalty via IQR on numeric columns
      - null critical field count
    """
    rows, cols = df.shape
    total_cells = rows * cols

    # Missing values
    if total_cells > 0:
        missing_cells = int(df.isna().sum().sum())
        missing_pct = (missing_cells / total_cells) * 100.0
    else:
        missing_cells = 0
        missing_pct = 0.0

    # Duplicate rows
    if rows > 0:
        duplicate_rows = int(df.duplicated().sum())
        duplicate_pct = (duplicate_rows / rows) * 100.0
    else:
        duplicate_rows = 0
        duplicate_pct = 0.0

    # Schema alias confidence / mismatch
    schema_def = SCHEMAS.get(dataset_type, {})
    if schema_name == "required":
        schema_mismatch_pct = 0.0
        variant = "required"
        critical_cols = set(schema_def.get("required", []))
    elif schema_name == "legacy":
        # Small penalty for using legacy schema instead of the preferred one
        schema_mismatch_pct = 20.0
        variant = "legacy"
        critical_cols = set(schema_def.get("legacy", []))
    else:
        # Should not happen for successful ingestions; keep a conservative default
        schema_mismatch_pct = 100.0
        variant = "unknown"
        critical_cols = set(schema_def.get("required", []))

    # Null critical field count (number of missing values in critical columns)
    null_critical_count = 0
    if critical_cols:
        critical_in_df = [c for c in critical_cols if c in df.columns]
        if critical_in_df:
            null_critical_count = int(df[critical_in_df].isna().sum().sum())

    # Outlier detection via IQR on numeric columns
    outlier_pct = 0.0
    if rows > 0:
        num_df = df.select_dtypes(include=["number"])
        if not num_df.empty:
            outlier_mask = pd.Series(False, index=num_df.index)
            for col in num_df.columns:
                series = num_df[col].dropna()
                if series.empty:
                    continue
                q1 = series.quantile(0.25)
                q3 = series.quantile(0.75)
                iqr = q3 - q1
                if iqr == 0:
                    continue
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                col_mask = (num_df[col] < lower) | (num_df[col] > upper)
                outlier_mask = outlier_mask | col_mask.fillna(False)
            outlier_rows = int(outlier_mask.sum())
            outlier_pct = (outlier_rows / rows) * 100.0

    # Final Data Quality Score
    data_quality_score = (
        100.0
        - (missing_pct * 0.3)
        - (duplicate_pct * 0.2)
        - (schema_mismatch_pct * 0.3)
        - (outlier_pct * 0.2)
    )
    data_quality_score = max(0.0, min(100.0, data_quality_score))

    if data_quality_score >= 85:
        reliability_label = "High"
    elif data_quality_score >= 65:
        reliability_label = "Medium"
    else:
        reliability_label = "Low"

    issue_breakdown = {
        "missing_value_percent": round(missing_pct, 1),
        "duplicate_row_percent": round(duplicate_pct, 1),
        "schema_mismatch_percent": round(schema_mismatch_pct, 1),
        "outlier_percent": round(outlier_pct, 1),
        "null_critical_field_count": null_critical_count,
        "schema_variant": variant,
    }

    return {
        "data_quality_score": round(data_quality_score, 1),
        "reliability_label": reliability_label,
        "issue_breakdown": issue_breakdown,
    }


def ingest_csv(
    file: UploadFile,
    dataset_type: str,
    db: Session,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Centralized CSV ingestion pipeline.

    1. Validate file extension
    2. Read CSV into DataFrame
    3. Validate schema (new or legacy columns)
    4. Normalize data
    5. Store in database
    6. Return (cleaned_df, result_dict)

    The caller (module service) can use cleaned_df for aggregation logic.
    """
    # 1. File extension check
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

    # 2. Read CSV
    try:
        content = file.file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse CSV file: {str(e)}",
        )

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="The uploaded CSV file is empty.",
        )

    # 3. Validate schema
    is_valid, schema_name, missing = validate_schema(df, dataset_type)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"CSV missing required columns: {', '.join(sorted(missing))}",
        )

    # 4. Normalize
    df = normalize(df, dataset_type, schema_name)

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="No valid rows remain after data cleaning.",
        )

    # 5. Data quality analysis (non-destructive, uses normalized DataFrame)
    quality = _compute_data_quality(df, dataset_type, schema_name)

    # 6. Store
    store_fn = _STORE_FNS.get(dataset_type)
    if not store_fn:
        raise HTTPException(
            status_code=500,
            detail=f"No storage handler for dataset type: {dataset_type}",
        )

    try:
        processed, failed = store_fn(df, db)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store data: {str(e)}",
        )

    # 7. Build result
    result = {
        "success": True,
        "records_processed": processed,
        "records_failed": failed,
        "dataset_type": dataset_type,
        "data_quality_score": quality["data_quality_score"],
        "reliability_label": quality["reliability_label"],
        "issue_breakdown": quality["issue_breakdown"],
    }

    return df, result
