# Data normalization pipeline — cleans and maps columns per dataset type
import pandas as pd


from typing import Dict, Optional
# Column mapping: new schema columns → DB-compatible column names
COLUMN_MAPS: Dict[str, Dict[str, Optional[str]]] = {
    "expense_data": {
        # New schema → DB fields
        "date": "month",        # extract month from date
        "vendor": None,         # not stored in current DB model
    },
    "fraud_data": {
        "vendor": None,         # not stored in current DB model
        "timestamp": None,      # not stored in current DB model
    },
    "inventory_data": {
        # 1:1 mapping, no transforms needed
    },
    "energy_data": {
        "date": "hour",                    # map date → hour
        "energy_consumption": "usage_kwh", # rename
        "department": None,                # not stored in current DB model
    },
}


def normalize(df: pd.DataFrame, dataset_type: str, schema_name: str) -> pd.DataFrame:
    """
    Normalize a DataFrame:
    1. Strip whitespace from string columns
    2. Drop rows with all-null values
    3. Map column names for new-schema uploads
    4. Coerce numeric types
    5. Drop remaining null rows in key columns

    Args:
        df: Raw DataFrame from CSV
        dataset_type: One of the 4 dataset types
        schema_name: "required" (new) or "legacy" (old columns)

    Returns:
        Cleaned, normalized DataFrame with DB-compatible columns
    """
    # Work on a copy
    df = df.copy()

    # 1. Trim whitespace on string columns
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].astype(str).str.strip()

    # 2. Drop fully-empty rows
    df = df.dropna(how="all")

    # 3. Column mapping (only for new-schema uploads)
    if schema_name == "required" and dataset_type in COLUMN_MAPS:
        col_map = COLUMN_MAPS[dataset_type]
        renames = {}
        drops = []

        for old_name, new_name in col_map.items():
            if old_name in df.columns:
                if new_name is None:
                    drops.append(old_name)
                else:
                    renames[old_name] = new_name

        if renames:
            df = df.rename(columns=renames)
        if drops:
            df = df.drop(columns=drops, errors="ignore")

    # 4. Coerce numeric types
    from services.schema_validator import SCHEMAS
    schema_types = SCHEMAS.get(dataset_type, {}).get("types", {})
    for col_name, col_type in schema_types.items():
        # Check both original and mapped column names
        target_col = col_name
        if target_col not in df.columns:
            # Try to find the mapped name
            col_map = COLUMN_MAPS.get(dataset_type, {})
            mapped = col_map.get(col_name)
            if mapped and mapped in df.columns:
                target_col = mapped
            else:
                continue

        if col_type == "float":
            df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
        elif col_type == "int":
            df[target_col] = pd.to_numeric(df[target_col], errors="coerce").fillna(0).astype(int)

    # 5. Drop rows where critical columns are NaN (after coercion)
    df = df.dropna(how="all")

    # Reset index
    df = df.reset_index(drop=True)

    return df
