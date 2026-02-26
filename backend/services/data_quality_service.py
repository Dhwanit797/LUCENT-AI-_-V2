from typing import Dict, Any, Tuple

import pandas as pd

from backend.services.schema_validator import validate_schema, SCHEMAS


def compute_data_quality(df: pd.DataFrame, dataset_type: str) -> Dict[str, Any]:
    """
    Score incoming CSV quality before analytics run.

    Returns:
      {
        data_quality_score: float (0–100),
        reliability_label: "High" | "Medium" | "Low",
        issue_breakdown: {...}
      }
    """
    if df is None or getattr(df, "empty", True):
        return {
            "data_quality_score": 0.0,
            "reliability_label": "Low",
            "issue_breakdown": {
                "missing_value_percent": 100.0,
                "duplicate_row_percent": 0.0,
                "schema_mismatch_percent": 100.0,
                "outlier_percent": 0.0,
                "null_critical_field_count": 0,
                "schema_variant": "unknown",
            },
        }

    # Use a copy with normalized column names for schema confidence only.
    df_q = df.copy()
    df_q.columns = [str(c).strip().lower() for c in df_q.columns]

    # Schema check (required vs legacy) for mismatch penalty + critical fields
    is_valid, schema_name, _missing = validate_schema(df_q, dataset_type)
    schema_def = SCHEMAS.get(dataset_type, {})
    if is_valid and schema_name == "required":
        schema_mismatch_pct = 0.0
        schema_variant = "required"
        critical_cols = set(schema_def.get("required", []))
    elif is_valid and schema_name == "legacy":
        # Using legacy aliases implies lower confidence
        schema_mismatch_pct = 20.0
        schema_variant = "legacy"
        critical_cols = set(schema_def.get("legacy", []))
    else:
        schema_mismatch_pct = 100.0
        schema_variant = "unknown"
        critical_cols = set(schema_def.get("required", []))

    rows, cols = df_q.shape
    total_cells = rows * cols

    # Missing values %
    missing_cells = int(df_q.isna().sum().sum()) if total_cells > 0 else 0
    missing_pct = (missing_cells / total_cells) * 100.0 if total_cells > 0 else 0.0

    # Duplicate rows %
    duplicate_rows = int(df_q.duplicated().sum()) if rows > 0 else 0
    duplicate_pct = (duplicate_rows / rows) * 100.0 if rows > 0 else 0.0

    # Null critical field count
    null_critical_count = 0
    if critical_cols:
        in_df = [c for c in critical_cols if c in df_q.columns]
        if in_df:
            null_critical_count = int(df_q[in_df].isna().sum().sum())

    # Outlier detection via IQR on numeric columns (row-level %)
    outlier_pct = 0.0
    if rows > 0:
        num_df = df_q.select_dtypes(include=["number"])
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
            outlier_pct = (outlier_rows / rows) * 100.0 if rows > 0 else 0.0

    # Score formula
    score = (
        100.0
        - (missing_pct * 0.3)
        - (duplicate_pct * 0.2)
        - (schema_mismatch_pct * 0.3)
        - (outlier_pct * 0.2)
    )
    score = max(0.0, min(100.0, score))

    if score >= 85:
        reliability = "High"
    elif score >= 65:
        reliability = "Medium"
    else:
        reliability = "Low"

    return {
        "data_quality_score": round(float(score), 1),
        "reliability_label": reliability,
        "issue_breakdown": {
            "missing_value_percent": round(float(missing_pct), 1),
            "duplicate_row_percent": round(float(duplicate_pct), 1),
            "schema_mismatch_percent": round(float(schema_mismatch_pct), 1),
            "outlier_percent": round(float(outlier_pct), 1),
            "null_critical_field_count": int(null_critical_count),
            "schema_variant": schema_variant,
        },
    }

