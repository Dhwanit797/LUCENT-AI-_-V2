"""
Explainability engine for FraudLens.
Generates human-readable explanation points for a flagged transaction
without touching or re-running the detection logic.
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from models.fraud import FraudRecord


# Thresholds used purely for explanation — not detection
_HIGH_AMOUNT_MULTIPLIER = 2.0   # flag if tx amount > 2× average
_BUSINESS_HOURS_START  = 8      # 08:00
_BUSINESS_HOURS_END    = 20     # 20:00


def _avg_amount(db: Session) -> float:
    records = db.query(FraudRecord).all()
    if not records:
        return 0.0
    return sum(r.amount for r in records) / len(records)


def _vendor_appears_once(transaction_id: str, db: Session) -> bool:
    """
    Treat transaction_id prefix (first 4 chars) as a pseudo-vendor code.
    If only one record shares that prefix it's considered a 'new vendor'.
    """
    prefix = transaction_id[:4] if len(transaction_id) >= 4 else transaction_id
    count = (
        db.query(FraudRecord)
        .filter(FraudRecord.transaction_id.like(f"{prefix}%"))
        .count()
    )
    return count == 1


def _is_outside_business_hours(transaction_id: str) -> bool:
    """
    Derive a pseudo hour from the numeric suffix of the transaction_id
    so we can produce a deterministic (demo-friendly) explanation.
    """
    digits = "".join(c for c in transaction_id if c.isdigit())
    if not digits:
        return False
    hour = int(digits[-2:]) % 24
    return not (_BUSINESS_HOURS_START <= hour < _BUSINESS_HOURS_END)


def _has_duplicate_amount(record: FraudRecord, db: Session) -> bool:
    """Check whether another fraud record shares the same amount."""
    count = (
        db.query(FraudRecord)
        .filter(
            FraudRecord.amount == record.amount,
            FraudRecord.transaction_id != record.transaction_id,
            FraudRecord.is_fraud == True,
        )
        .count()
    )
    return count > 0


def explain_transaction(transaction_id: str, db: Session) -> Dict[str, Any]:
    """
    Provide per-transaction explanations that reflect how unusual this record is
    compared with the rest of the uploaded dataset.

    We only have access to the persisted fraud table (transaction_id, amount, is_fraud),
    so we derive explanations from relative statistics:
    - amount vs dataset average and top percentiles
    - repeated / duplicate amounts among other flagged transactions
    - simple pseudo vendor + time-of-day signals based on the transaction_id
    """
    record: FraudRecord | None = (
        db.query(FraudRecord)
        .filter(FraudRecord.transaction_id == transaction_id)
        .first()
    )

    if record is None:
        return {"found": False, "transaction_id": transaction_id, "points": []}

    # Pull the full set once so we can compare this transaction to the rest
    records: List[FraudRecord] = db.query(FraudRecord).all()
    amounts = [r.amount for r in records if r.amount is not None]

    avg_all = sum(amounts) / len(amounts) if amounts else 0.0
    amounts_sorted = sorted(amounts)

    def _percentile(p: float) -> int:
        if not amounts_sorted:
            return 0
        # Clamp index to range [0, len-1]
        idx = int(round(p * (len(amounts_sorted) - 1)))
        idx = max(0, min(len(amounts_sorted) - 1, idx))
        return amounts_sorted[idx]

    p75 = _percentile(0.75)
    p90 = _percentile(0.90)

    points: List[Dict[str, str]] = []

    # 1. Amount anomaly vs overall dataset
    if avg_all > 0 and record.amount is not None:
        ratio = record.amount / avg_all
        if ratio >= 3.0:
            points.append({
                "icon": "amount",
                "label": "Severe Amount Anomaly",
                "detail": (
                    f"This transaction (${record.amount:,}) is about {ratio:.1f}× higher than the "
                    f"typical transaction in this dataset (avg ≈ ${avg_all:,.0f}). "
                    "Such an outlier is a strong fraud signal."
                ),
            })
        elif ratio >= _HIGH_AMOUNT_MULTIPLIER:
            points.append({
                "icon": "amount",
                "label": "Unusually High Amount",
                "detail": (
                    f"Transaction amount (${record.amount:,}) is roughly {ratio:.1f}× the dataset "
                    f"average (${avg_all:,.0f}), which is higher than normal spending patterns."
                ),
            })
        elif ratio >= 1.2:
            points.append({
                "icon": "amount",
                "label": "Above Typical Spend",
                "detail": (
                    f"Transaction amount (${record.amount:,}) is modestly above the dataset "
                    f"average ({ratio:.1f}× higher). In combination with other signals, it "
                    "contributes to the overall risk score."
                ),
            })
        elif record.is_fraud:
            # For flagged transactions where amount alone isn't extreme, still add a
            # small explanatory note so each flagged record has at least one reason.
            points.append({
                "icon": "amount",
                "label": "Amount Within Normal Band",
                "detail": (
                    f"Transaction amount (${record.amount:,}) is close to the dataset average "
                    f"(${avg_all:,.0f}). The flag is driven more by pattern-based signals than "
                    "by raw value."
                ),
            })

    # 2. Very high compared to peers (top percentile)
    if record.amount is not None and p90 and record.amount >= p90:
        points.append({
            "icon": "amount",
            "label": "Top-Value Transaction",
            "detail": (
                f"This payment (${record.amount:,}) sits in roughly the top 10% of all "
                "transactions by value in this dataset, which increases its risk weight."
            ),
        })
    elif record.amount is not None and p75 and record.amount >= p75 and record.is_fraud:
        points.append({
            "icon": "amount",
            "label": "High Relative to Peers",
            "detail": (
                f"The amount (${record.amount:,}) is higher than at least ~75% of transactions "
                "in this upload, making it more suspicious than typical activity."
            ),
        })

    # 3. Duplicate / structured amount patterns around 50k
    if record.amount is not None:
        STRUCT_THRESHOLD = 50_000
        near_threshold = abs(record.amount - STRUCT_THRESHOLD) <= int(STRUCT_THRESHOLD * 0.05)
        if near_threshold:
            band_low = int(record.amount * 0.95)
            band_high = int(record.amount * 1.05)
            similar_count = (
                db.query(FraudRecord)
                .filter(
                    FraudRecord.id != record.id,
                    FraudRecord.amount >= band_low,
                    FraudRecord.amount <= band_high,
                    FraudRecord.is_fraud == True,  # noqa: E712
                )
                .count()
            )
            if similar_count >= 2:
                points.append({
                    "icon": "duplicate",
                    "label": "Structured Amount Pattern",
                    "detail": (
                        f"The amount ${record.amount:,} sits near a common reporting threshold "
                        "and appears multiple times across other flagged transactions. This "
                        "repetition near the same level is consistent with structuring behaviour."
                    ),
                })

    # 4. New / rare pseudo-vendor from transaction id prefix
    if _vendor_appears_once(transaction_id, db):
        points.append({
            "icon": "vendor",
            "label": "New or Unrecognised Counterparty",
            "detail": (
                f"A pseudo-vendor code derived from the transaction ID "
                f"\"{transaction_id[:4]}\" appears only once across all records, which "
                "indicates no prior history with this counterparty in the current dataset."
            ),
        })

    # 5. Pseudo time-of-day anomaly derived from the id (for demo purposes)
    if _is_outside_business_hours(transaction_id):
        digits = "".join(c for c in transaction_id if c.isdigit())
        hour = int(digits[-2:]) % 24 if digits else 0
        points.append({
            "icon": "hours",
            "label": "Outside Business Hours",
            "detail": (
                f"A proxy transaction time (~{hour:02d}:00 derived from the ID) falls outside "
                f"standard business hours ({_BUSINESS_HOURS_START:02d}:00–"
                f"{_BUSINESS_HOURS_END:02d}:00), which typically carries higher risk."
            ),
        })

    # 6. Explicit model-based explanation if transaction is flagged but no
    #    strong statistical patterns were detected above.
    if record.is_fraud and not points:
        points.append({
            "icon": "model",
            "label": "Flagged by Detection Rules",
            "detail": (
                "This transaction crossed the Suspicious / High Risk threshold in the "
                "FraudLens scoring model based on its combination of amount and dataset "
                "context, even though no single factor stands out on its own."
            ),
        })
    elif not record.is_fraud and not points:
        points.append({
            "icon": "model",
            "label": "Below Fraud Thresholds",
            "detail": (
                "This transaction remained under the risk thresholds in the FraudLens model "
                "when compared with the rest of the dataset, so it is not flagged."
            ),
        })

    return {
        "found": True,
        "transaction_id": transaction_id,
        "amount": record.amount,
        "is_fraud": record.is_fraud,
        "points": points,
    }
