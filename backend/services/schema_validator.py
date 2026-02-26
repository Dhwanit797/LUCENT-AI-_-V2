# Schema definitions and validation for each dataset type
from typing import Dict, List, Set, Tuple, Any
import pandas as pd


# Each dataset type has:
# - "required": columns that MUST be present (new schema)
# - "legacy": alternative column sets accepted for backward compat
# - "types": expected data types for coercion
SCHEMAS: Dict[str, Dict[str, Any]] = {
    "expense_data": {
        "required": {"date", "category", "amount", "vendor"},
        "legacy": {"category", "amount", "month"},
        "types": {"amount": "float"},
    },
    "fraud_data": {
        "required": {"transaction_id", "vendor", "amount", "timestamp"},
        "legacy": {"transaction_id", "amount", "is_fraud"},
        "types": {"amount": "float"},
    },
    "inventory_data": {
        "required": {"item_name", "quantity", "price", "category"},
        "legacy": {"item_name", "quantity", "price", "category"},
        "types": {"quantity": "int", "price": "float"},
    },
    "energy_data": {
        "required": {"date", "energy_consumption", "department"},
        "legacy": {"hour", "usage_kwh"},
        "types": {"energy_consumption": "float", "usage_kwh": "float"},
    },
}


def validate_schema(
    df: pd.DataFrame, dataset_type: str
) -> Tuple[bool, str, Set[str]]:
    """
    Validate that a DataFrame matches the expected schema for a dataset type.

    Returns:
        (is_valid, matched_schema_name, missing_columns)
        matched_schema_name is "required" or "legacy" or "" if invalid
    """
    if dataset_type not in SCHEMAS:
        return False, "", {f"Unknown dataset_type: {dataset_type}"}

    schema = SCHEMAS[dataset_type]
    columns = set(df.columns)

    # Try new required schema first
    required = schema["required"]
    if required.issubset(columns):
        return True, "required", set()

    # Try legacy schema
    legacy = schema["legacy"]
    if legacy.issubset(columns):
        return True, "legacy", set()

    # Neither matched — report missing from BOTH sets (show which are closest)
    missing_required = required - columns
    missing_legacy = legacy - columns

    # Return whichever has fewer missing columns
    if len(missing_required) <= len(missing_legacy):
        return False, "", missing_required
    else:
        return False, "", missing_legacy
