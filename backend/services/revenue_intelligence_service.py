from __future__ import annotations

from typing import Dict, Any, List, Tuple

from sqlalchemy.orm import Session

from backend.models.expense import ExpenseItem
from backend.services.fraud_service import get_fraud_insights
from backend.services.inventory_service import get_inventory_summary, get_inventory_forecast


def _build_revenue_series(db: Session) -> List[Tuple[int, float]]:
  """
  Build a simple time-indexed revenue series from expenses data.

  Since the current schema does not have an explicit revenue table, we treat
  positive ExpenseItem.amount grouped by month as a proxy for revenue
  movement over time. Each distinct month is mapped to an integer index
  in chronological order.
  """
  items = db.query(ExpenseItem).all()
  if not items:
    return []

  # Aggregate by month string; assume lexicographically sortable (e.g. "2024-01")
  by_month: Dict[str, float] = {}
  for it in items:
    m = (it.month or "").strip()
    if not m:
      continue
    by_month[m] = by_month.get(m, 0.0) + float(it.amount or 0.0)

  if not by_month:
    return []

  months = sorted(by_month.keys())
  series: List[Tuple[int, float]] = []
  for idx, m in enumerate(months):
    series.append((idx, by_month[m]))
  return series


def _linear_regression(xs: List[float], ys: List[float]) -> Tuple[float, float]:
  """
  Very small least-squares linear regression implementation:
    y = slope * x + intercept
  """
  n = len(xs)
  if n == 0:
    return 0.0, 0.0

  mean_x = sum(xs) / n
  mean_y = sum(ys) / n
  num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
  den = sum((x - mean_x) ** 2 for x in xs)
  if den == 0:
    return 0.0, mean_y
  slope = num / den
  intercept = mean_y - slope * mean_x
  return float(slope), float(intercept)


def _moving_average(values: List[float], window: int = 3) -> List[float]:
  if window <= 1 or len(values) < window:
    return values[:]
  out: List[float] = []
  for i in range(len(values)):
    start = max(0, i - window + 1)
    window_vals = values[start : i + 1]
    out.append(sum(window_vals) / len(window_vals))
  return out


def _forecast_with_confidence(
  xs: List[float],
  ys: List[float],
  slope: float,
  intercept: float,
  horizon_points: int,
) -> List[Dict[str, Any]]:
  """
  Produce a simple forecast series with a symmetric confidence band based on
  residual variance.
  """
  if not xs or not ys or horizon_points <= 0:
    return []

  # Residual standard deviation as a lightweight uncertainty proxy
  residuals = [y - (slope * x + intercept) for x, y in zip(xs, ys)]
  if residuals:
    var = sum(r * r for r in residuals) / len(residuals)
  else:
    var = 0.0
  sigma = var ** 0.5

  last_x = xs[-1] if xs else 0.0
  out: List[Dict[str, Any]] = []
  for i in range(1, horizon_points + 1):
    x = last_x + i
    base = slope * x + intercept
    # 1-sigma band
    out.append(
      {
        "step": i,
        "value": float(base),
        "lower": float(base - sigma),
        "upper": float(base + sigma),
      }
    )
  return out


def analyze_revenue_intelligence(db: Session) -> Dict[str, Any]:
  """
  Analyze revenue sustainability and growth stability.

  Returns:
    {
      revenue_momentum_index: float,
      sustainability_score: float,
      growth_risk_flag: bool,
      forecast_data: {
        horizon: [30, 60, 90],
        points: [{step, value, lower, upper}, ...]
      }
    }
  """
  series = _build_revenue_series(db)
  if not series:
    return {
      "revenue_momentum_index": 0.0,
      "sustainability_score": 0.0,
      "growth_risk_flag": True,
      "forecast_data": {"horizon_days": [30, 60, 90], "points": []},
    }

  xs = [float(i) for i, _ in series]
  ys = [float(v) for _, v in series]

  slope, intercept = _linear_regression(xs, ys)

  # Growth acceleration: difference of slopes over early vs late halves
  mid = max(1, len(xs) // 2)
  early_slope, _ = _linear_regression(xs[:mid], ys[:mid])
  late_slope, _ = _linear_regression(xs[mid:], ys[mid:])
  growth_accel = float(late_slope - early_slope)

  ma = _moving_average(ys, window=3)

  # Momentum index: combine slope and acceleration, scaled into 0–100
  # (heuristic scaling based on relative change)
  base_level = abs(sum(ys) / len(ys)) or 1.0
  norm_slope = (slope / base_level) * 100.0
  norm_accel = (growth_accel / base_level) * 100.0
  raw_momentum = norm_slope * 0.7 + norm_accel * 0.3
  revenue_momentum_index = max(0.0, min(100.0, 50.0 + raw_momentum))

  # Forecast 3 generic future points representing 30/60/90 days.
  # We keep the step index abstract; the frontend can map to 30/60/90 days.
  forecast_points = _forecast_with_confidence(xs, ys, slope, intercept, horizon_points=3)

  # --- Contextual sustainability penalty based on other modules -------------
  fraud = get_fraud_insights(db)
  inv_summary = get_inventory_summary(db)
  inv_forecast = get_inventory_forecast(db)

  fraud_pct = float(fraud.get("anomalies_detected", 0) or 0)
  total_tx = float(fraud.get("total_transactions", 0) or 0)
  fraud_rate = (fraud_pct / total_tx * 100.0) if total_tx > 0 else 0.0

  low_stock_count = int(inv_summary.get("low_stock_count", 0) or 0)
  total_items = len(inv_summary.get("items") or [])
  depletion_ratio = (low_stock_count / total_items * 100.0) if total_items > 0 else 0.0

  # Cash burn proxy: volatility of revenue series
  mean_rev = sum(ys) / len(ys)
  if len(ys) > 1:
    var_rev = sum((y - mean_rev) ** 2 for y in ys) / (len(ys) - 1)
    cash_instability = (var_rev ** 0.5) / (abs(mean_rev) or 1.0) * 100.0
  else:
    cash_instability = 0.0

  # Simple penalties
  fraud_penalty = min(30.0, fraud_rate * 0.4)
  inv_penalty = min(25.0, depletion_ratio * 0.3)
  cash_penalty = min(25.0, cash_instability * 0.5)

  sustainability_raw = revenue_momentum_index - (fraud_penalty + inv_penalty + cash_penalty)
  sustainability_score = max(0.0, min(100.0, sustainability_raw))

  growth_risk_flag = sustainability_score < 60.0

  return {
    "revenue_momentum_index": round(revenue_momentum_index, 1),
    "sustainability_score": round(sustainability_score, 1),
    "growth_risk_flag": bool(growth_risk_flag),
    "forecast_data": {
      "horizon_days": [30, 60, 90],
      "points": forecast_points,
      "moving_average": [{"index": i, "value": float(v)} for i, v in enumerate(ma)],
    },
  }

