"""
FraudLens Risk Engine — deterministic, banking-style fraud scoring.
No randomness. All rules are reproducible given the same input.
"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional


# ── Column name aliases → canonical names ──────────────────────────────────
_COL_ALIASES: Dict[str, List[str]] = {
    "transaction_id":    ["txn_id", "tx_id", "id", "transaction", "txid", "tid"],
    "amount":            ["amt", "value", "total", "price", "sum"],
    "timestamp":         ["date", "datetime", "time", "created_at", "ts", "date_time", "transaction_date"],
    "merchant_category": ["category", "merchant", "vendor", "type", "merchant_type", "cat"],
    "account_age_days":  ["account_age", "age_days", "account_days", "age", "days_since_opening"],
}

HIGH_RISK_CATEGORIES = {"gambling", "crypto", "gift_cards", "prepaid", "wire_transfer"}


def normalize_columns(columns: List[str]) -> Dict[str, str]:
    """Return mapping: original_col -> canonical_name (only for matched ones)."""
    cols_lower = {c: c.lower().strip() for c in columns}
    mapping: Dict[str, str] = {}
    for canonical, aliases in _COL_ALIASES.items():
        for orig, lower in cols_lower.items():
            if lower == canonical or lower in aliases:
                mapping[orig] = canonical
                break
    return mapping


# ── Core scoring function ───────────────────────────────────────────────────

def compute_fraud_score(
    transaction: Dict[str, Any],
    user_history: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Compute a deterministic fraud risk score (0–100) for one transaction.

    transaction keys (canonical):
        transaction_id, amount, timestamp, merchant_category, account_age_days

    Returns dict with:
        risk_score (int 0–100)
        risk_label  ("Safe" | "Suspicious" | "High Risk")
        breakdown   (dict of component scores)
    """
    score = 0
    breakdown: Dict[str, int] = {}

    amount: float = float(transaction.get("amount") or 0)

    # ── 1. Amount Anomaly (weight 25) ────────────────────────────────────
    if user_history:
        amounts = [float(h.get("amount") or 0) for h in user_history]
        if amounts:
            total = sum(amounts)
            n = len(amounts)
            # Use average excluding current transaction if possible
            avg = (total - amount) / (n - 1) if n > 1 else total
        else:
            avg = 0.0

        if avg > 0:
            ratio = amount / avg
            if ratio >= 3.0:
                amt_score = 25
            elif ratio >= 2.0:
                amt_score = 15
            elif ratio >= 1.5:
                amt_score = 8
            else:
                amt_score = 0
        else:
            amt_score = 15 if amount > 50000 else 0
    else:
        # No history — use absolute threshold from spec
        amt_score = 15 if amount > 50000 else 0
    score += amt_score
    breakdown["amount_anomaly"] = amt_score

    # ── 2. Velocity Check (weight 20) ────────────────────────────────────
    vel_score = 0
    ts_raw = transaction.get("timestamp")
    if ts_raw and user_history:
        try:
            tx_time = _parse_ts(str(ts_raw))
            if tx_time:
                window_count = sum(
                    1 for h in user_history
                    if _parse_ts(str(h.get("timestamp") or ""))
                    and abs((_parse_ts(str(h.get("timestamp"))) - tx_time).total_seconds()) <= 600  # type: ignore[operator]
                )
                if window_count >= 5:
                    vel_score = 20
                elif window_count >= 3:
                    vel_score = 10
        except Exception:
            pass
    score += vel_score
    breakdown["velocity"] = vel_score

    # ── 3. Merchant Risk (weight 15) ─────────────────────────────────────
    category_raw = str(transaction.get("merchant_category") or "").lower().strip()
    # Normalize: replace spaces/hyphens with underscores
    category = category_raw.replace(" ", "_").replace("-", "_")
    merch_score = 15 if category in HIGH_RISK_CATEGORIES else 0
    score += merch_score
    breakdown["merchant_risk"] = merch_score

    # ── 4. Time-of-Day Anomaly (weight 10) ───────────────────────────────
    time_score = 0
    if ts_raw:
        try:
            tx_time = _parse_ts(str(ts_raw))
            if tx_time and 0 <= tx_time.hour < 5:
                time_score = 10
        except Exception:
            pass
    score += time_score
    breakdown["time_anomaly"] = time_score

    # ── 5. Account Age Risk (weight 15) ──────────────────────────────────
    age_score = 0
    age_raw = transaction.get("account_age_days")
    if age_raw is not None:
        try:
            age = int(float(age_raw))
            if age < 7 and amount > 20000:
                age_score = 15
            elif age < 30 and amount > 50000:
                age_score = 10
        except (ValueError, TypeError):
            pass
    score += age_score
    breakdown["account_age"] = age_score

    # ── 6. Structuring Detection (weight 15) ─────────────────────────────
    struct_score = 0
    # Spec: look for amounts clustered around the 50k reporting threshold
    STRUCT_THRESHOLD = 50000
    if user_history:
        band_low = amount * 0.95
        band_high = amount * 1.05
        # \"Near\" the threshold = within ±5%
        near_threshold = abs(amount - STRUCT_THRESHOLD) <= STRUCT_THRESHOLD * 0.05
        similar_count = sum(
            1 for h in user_history
            if band_low <= float(h.get("amount") or 0) <= band_high
        )
        # Require at least 3 similar transactions to treat as structuring
        if similar_count >= 3 and near_threshold:
            struct_score = 15
    score += struct_score
    breakdown["structuring"] = struct_score

    # ── Clamp & label ─────────────────────────────────────────────────────
    risk_score = max(0, min(100, score))
    if risk_score < 30:
        risk_label = "Safe"
    elif risk_score < 70:
        risk_label = "Suspicious"
    else:
        risk_label = "High Risk"

    return {
        "risk_score": risk_score,
        "risk_label": risk_label,
        "breakdown": breakdown,
    }


# ── Helpers ────────────────────────────────────────────────────────────────

_TS_FORMATS = [
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%d",
    "%d/%m/%Y %H:%M:%S",
    "%d/%m/%Y",
    "%m/%d/%Y %H:%M:%S",
    "%m/%d/%Y",
    "%Y/%m/%d %H:%M:%S",
    "%Y/%m/%d",
]


def _parse_ts(s: str) -> Optional[datetime]:
    s = s.strip()
    for fmt in _TS_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None
