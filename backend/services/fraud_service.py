import json
from pathlib import Path

import pandas as pd
from typing import List, Dict, Any
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from backend.models.fraud import FraudRecord
from backend.services.fraud_engine import normalize_columns, compute_fraud_score
from backend.services.data_quality_service import compute_data_quality


_SNAPSHOT_PATH = Path(__file__).resolve().parent / "fraud_snapshot.json"


def _write_fraud_snapshot(payload: Dict[str, Any]) -> None:
    """
    Persist the latest FraudLens engine output so other services (insights, PDF)
    can reuse the exact same risk scores and labels.
    """
    try:
        _SNAPSHOT_PATH.write_text(
            json.dumps(payload, ensure_ascii=False),
            encoding="utf-8",
        )
    except Exception:
        # Snapshot failures must never break main fraud upload flow
        pass


def _read_fraud_snapshot():
    try:
        if not _SNAPSHOT_PATH.exists():
            return None
        return json.loads(_SNAPSHOT_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None


def get_fraud_status(db: Session) -> Dict[str, Any]:
    count = db.query(FraudRecord).count()
    return {"has_data": count > 0, "row_count": count}


def get_fraud_insights(db: Session) -> Dict[str, Any]:
    # Preferred path: reuse the exact engine output snapshot so scores/labels
    # match FraudLens analysis and the exported PDF.
    snapshot = _read_fraud_snapshot()
    if snapshot and snapshot.get("transactions"):
        txs = snapshot.get("transactions") or []
        summary = snapshot.get("summary") or {}
        total = int(summary.get("total_transactions") or len(txs))

        flagged_txs = [
            t for t in txs
            if t.get("is_fraud") or t.get("risk_label") != "Safe"
        ]
        anomalies_detected = len(flagged_txs)
        pct = (anomalies_detected / total * 100) if total > 0 else 0
        risk = "high" if pct > 50 else "medium" if pct > 20 else "low"

        alerts = []
        for t in flagged_txs[:50]:
            try:
                score_val = float(t.get("risk_score", 0)) / 100.0
            except (TypeError, ValueError):
                score_val = 0.0
            alerts.append({
                "id": str(t.get("transaction_id", "")),
                "type": str(t.get("risk_label", "Fraud flagged") or "Fraud flagged"),
                "score": max(0.0, min(1.0, score_val)),
            })

        return {
            "anomalies_detected": anomalies_detected,
            "total_transactions": total,
            "risk_level": risk,
            "alerts": alerts,
        }

    # Fallback when no snapshot is available: derive coarse insights
    # directly from the persisted fraud records.
    records = db.query(FraudRecord).all()
    if not records:
        return {
            "anomalies_detected": 0,
            "total_transactions": 0,
            "risk_level": "none",
            "alerts": [],
        }

    fraud_records = [r for r in records if r.is_fraud]
    fraud_count = len(fraud_records)
    total = len(records)
    pct = (fraud_count / total * 100) if total > 0 else 0
    risk = "high" if pct > 50 else "medium" if pct > 20 else "low"

    alerts = []
    for r in fraud_records[:50]:
        risk_score = getattr(r, "risk_score", None)
        if risk_score is not None:
            score_val = max(0.0, min(1.0, float(risk_score) / 100.0))
        else:
            # Very rough fallback based only on amount scale so that callers still
            # receive a usable score in [0,1] even without engine metadata.
            try:
                amt = float(r.amount or 0)
                score_val = min(1.0, max(0.3, amt / 10000.0))
            except (TypeError, ValueError):
                score_val = 0.5
        alerts.append({
            "id": r.transaction_id,
            "type": getattr(r, "risk_label", "Fraud flagged") or "Fraud flagged",
            "score": score_val,
        })

    return {
        "anomalies_detected": fraud_count,
        "total_transactions": total,
        "risk_level": risk,
        "alerts": alerts,
    }


def get_fraud_chart_data(db: Session) -> List[Dict[str, Any]]:
    records = db.query(FraudRecord).all()
    if not records:
        return []
    normal = sum(1 for r in records if not r.is_fraud)
    flagged = sum(1 for r in records if r.is_fraud)
    return [{"day": "Total", "normal": normal, "flagged": flagged}]


def upload_fraud_csv(file: UploadFile, db: Session) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    try:
        df = pd.read_csv(file.file)
        df.columns = [str(c).strip() for c in df.columns]

        # ── Normalize column names ────────────────────────────────────────
        col_map = normalize_columns(list(df.columns))
        df.rename(columns=col_map, inplace=True)

        # transaction_id and amount are the only hard requirements
        if "transaction_id" not in df.columns:
            # try to use the first column as transaction_id
            df.rename(columns={df.columns[0]: "transaction_id"}, inplace=True)
        if "amount" not in df.columns:
            raise HTTPException(
                status_code=400,
                detail="CSV must contain an 'amount' column (or alias: amt, value, total, price)."
            )

        # Compute data quality BEFORE we add synthetic optional columns so the
        # score reflects the actual incoming CSV quality.
        quality_df = df.copy()
        quality = compute_data_quality(quality_df, "fraud_data")

        # Fill missing optional columns
        for col in ("timestamp", "merchant_category", "account_age_days"):
            if col not in df.columns:
                df[col] = None

        # ── Clear existing data ───────────────────────────────────────────
        db.query(FraudRecord).delete()
        db.commit()

        # Convert to list-of-dicts for engine
        rows = df.to_dict(orient="records")

        # ── Run fraud engine ──────────────────────────────────────────────
        transactions_out = []
        safe_count = suspicious_count = high_risk_count = 0
        score_sum = 0

        # Timeline: group by date if timestamp present
        timeline: Dict[str, Dict[str, int]] = {}

        # Use a bounded sliding window of recent transactions as "history" when scoring
        # each row. This keeps the engine responsive for large CSVs while preserving
        # local pattern detection (velocity, structuring, etc.).
        WINDOW_SIZE = 200

        for idx, row in enumerate(rows):
            tx_id = str(row.get("transaction_id", "")).strip() or f"TX-{len(transactions_out)}"
            amount = _safe_float(row.get("amount"))

            history_start = max(0, idx - WINDOW_SIZE)
            history_slice = rows[history_start:idx]

            result = compute_fraud_score(row, history_slice)
            risk_score: int = result["risk_score"]
            risk_label: str = result["risk_label"]

            # Derive is_fraud from engine: Suspicious or High Risk = True
            is_fraud = risk_label != "Safe"

            # Persist to DB
            record = FraudRecord(
                transaction_id=tx_id,
                amount=int(amount),
                is_fraud=is_fraud,
            )
            db.add(record)

            # Counters
            if risk_label == "Safe":
                safe_count += 1
            elif risk_label == "Suspicious":
                suspicious_count += 1
            else:
                high_risk_count += 1
            score_sum += risk_score

            # Timeline entry
            ts_raw = row.get("timestamp")
            date_key = _extract_date(ts_raw)
            if date_key not in timeline:
                timeline[date_key] = {"safe": 0, "suspicious": 0, "high_risk": 0}
            timeline[date_key][risk_label.lower().replace(" ", "_")] += 1

            transactions_out.append({
                "transaction_id": tx_id,
                "amount": amount,
                "timestamp": str(ts_raw) if ts_raw else None,
                "merchant_category": str(row.get("merchant_category") or ""),
                "account_age_days": row.get("account_age_days"),
                "risk_score": risk_score,
                "risk_label": risk_label,
                "breakdown": result["breakdown"],
                "is_fraud": is_fraud,
            })

        db.commit()

        total = len(transactions_out)
        avg_score = round(score_sum / total, 1) if total > 0 else 0

        # Risk distribution for pie chart
        risk_distribution = [
            {"name": "Safe",        "value": safe_count,        "color": "#22c594"},
            {"name": "Suspicious",  "value": suspicious_count,  "color": "#fbbf24"},
            {"name": "High Risk",   "value": high_risk_count,   "color": "#f84646"},
        ]

        # Timeline series sorted by date
        timeline_series = [
            {"date": k, **v}
            for k, v in sorted(timeline.items())
        ]

        result: Dict[str, Any] = {
            "transactions": transactions_out,
            "summary": {
                "total_transactions": total,
                "safe_count": safe_count,
                "suspicious_count": suspicious_count,
                "high_risk_count": high_risk_count,
                "average_risk_score": avg_score,
                # Legacy fields for backward compat
                "fraud_count": suspicious_count + high_risk_count,
                "normal_count": safe_count,
                "fraud_percentage": round(
                    ((suspicious_count + high_risk_count) / total * 100) if total > 0 else 0, 1
                ),
            },
            "chart_data": {
                "risk_distribution": risk_distribution,
                "timeline_series": timeline_series,
            },
            **quality,
        }

        # Persist snapshot so reports and insights can exactly mirror this analysis.
        _write_fraud_snapshot(result)

        return result

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")


# ── Helpers ───────────────────────────────────────────────────────────────

def _safe_float(v: Any) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _extract_date(ts_raw: Any) -> str:
    if not ts_raw:
        return "Unknown"
    s = str(ts_raw).strip()
    # ISO / space-separated datetime → take date part
    for sep in ["T", " "]:
        if sep in s:
            return s.split(sep)[0]
    # Already a date or unintelligible
    return s[:10] if len(s) >= 10 else s
