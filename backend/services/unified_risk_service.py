from __future__ import annotations

from typing import Dict, Any, List

from sqlalchemy.orm import Session

from services.fraud_service import get_fraud_insights
from services.expense_service import get_expense_summary
from services.inventory_service import get_inventory_summary
from services.green_grid_service import get_green_grid_data


def _normalize(value: float, min_v: float, max_v: float) -> float:
  if max_v == min_v:
    return 0.0
  return max(0.0, min(1.0, (value - min_v) / (max_v - min_v)))


def _trend_metrics(values: List[float]) -> Dict[str, Any]:
  """
  Compute simple trend direction, acceleration-like metric and volatility from
  a small series of numeric points.
  """
  if len(values) < 2:
    return {
      "trend_direction": "flat",
      "trend_slope": 0.0,
      "trend_acceleration": 0.0,
      "volatility_score": 0.0,
    }

  xs = list(range(len(values)))
  n = len(xs)
  mean_x = sum(xs) / n
  mean_y = sum(values) / n
  num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, values))
  den = sum((x - mean_x) ** 2 for x in xs)
  slope = num / den if den != 0 else 0.0

  # Approximate acceleration as last difference minus first difference
  first_diff = values[1] - values[0]
  last_diff = values[-1] - values[-2]
  accel = last_diff - first_diff

  # Volatility: coefficient of variation scaled to 0–100
  mean_val = mean_y or 1.0
  if n > 1:
    var = sum((v - mean_y) ** 2 for v in values) / (n - 1)
    std = var ** 0.5
  else:
    std = 0.0
  volatility = (std / abs(mean_val)) * 100.0

  if slope > 0.5:
    direction = "up"
  elif slope < -0.5:
    direction = "down"
  else:
    direction = "flat"

  return {
    "trend_direction": direction,
    "trend_slope": float(slope),
    "trend_acceleration": float(accel),
    "volatility_score": float(volatility),
  }


def compute_unified_risk_index(db: Session) -> Dict[str, Any]:
  """
  Combine fraud risk, cash instability, inventory risk and supplier risk
  into a single Unified Risk Index.

  URI = (fraud * 0.35) + (cash * 0.25) + (inventory * 0.20) + (supplier * 0.20)

  Returns:
    {
      unified_risk_index,
      trend_direction,
      volatility_score,
      confidence_percentage,
    }
  """
  fraud = get_fraud_insights(db)
  expense = get_expense_summary(db)
  inventory = get_inventory_summary(db)
  green = get_green_grid_data(db)

  # --- Fraud component -------------------------------------------------------
  total_tx = float(fraud.get("total_transactions", 0) or 0)
  anomalies = float(fraud.get("anomalies_detected", 0) or 0)
  fraud_rate_pct = (anomalies / total_tx * 100.0) if total_tx > 0 else 0.0
  fraud_risk = _normalize(fraud_rate_pct, 0.0, 60.0) * 100.0

  # --- Cash instability component --------------------------------------------
  by_cat = expense.get("by_category") or []
  cat_values = [float(c.get("value", 0.0)) for c in by_cat]
  if len(cat_values) > 1:
    mean_v = sum(cat_values) / len(cat_values)
    var_v = sum((v - mean_v) ** 2 for v in cat_values) / (len(cat_values) - 1)
    std_v = var_v ** 0.5
    cash_instability_pct = (std_v / (abs(mean_v) or 1.0)) * 100.0
  else:
    cash_instability_pct = 0.0
  cash_risk = _normalize(cash_instability_pct, 0.0, 80.0) * 100.0

  # --- Inventory risk component ---------------------------------------------
  items = inventory.get("items") or []
  low_stock_count = int(inventory.get("low_stock_count", 0) or 0)
  total_items = len(items)
  depletion_pct = (low_stock_count / total_items * 100.0) if total_items > 0 else 0.0
  inventory_risk = _normalize(depletion_pct, 0.0, 70.0) * 100.0

  # --- Supplier risk component ----------------------------------------------
  # Derived from Green Grid: higher usage and higher potential savings imply
  # more fragile supplier/energy situation.
  avg_usage = float(green.get("current_usage_kwh", 0.0) or 0.0)
  savings_pct = float(green.get("potential_savings_percent", 0.0) or 0.0)
  # Simple heuristic: combine normalized average usage and savings
  supplier_signal = (_normalize(avg_usage, 0.0, 100.0) * 0.6 +
                     _normalize(savings_pct, 0.0, 40.0) * 0.4)
  supplier_risk = supplier_signal * 100.0

  # --- Unified Risk Index ----------------------------------------------------
  uri = (
    fraud_risk * 0.35
    + cash_risk * 0.25
    + inventory_risk * 0.20
    + supplier_risk * 0.20
  )
  unified_risk_index = max(0.0, min(100.0, uri))

  # Build a small synthetic history for trend estimation using scaled inputs.
  history_series = [
    fraud_risk,
    (fraud_risk + cash_risk) / 2.0,
    unified_risk_index,
  ]
  trend = _trend_metrics(history_series)

  # Confidence: higher when inputs are consistent and volatility is low.
  volatility = trend["volatility_score"]
  base_conf = 90.0 - _normalize(volatility, 0.0, 80.0) * 40.0
  confidence_percentage = max(0.0, min(100.0, base_conf))

  return {
    "unified_risk_index": round(float(unified_risk_index), 1),
    "trend_direction": trend["trend_direction"],
    "volatility_score": round(float(trend["volatility_score"]), 1),
    "confidence_percentage": round(float(confidence_percentage), 1),
  }

