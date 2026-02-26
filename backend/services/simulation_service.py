from typing import Dict, Any, List

from sqlalchemy.orm import Session

from backend.services.health_score_service import get_health_score
from backend.services.expense_service import get_expense_summary
from backend.services.inventory_service import get_inventory_forecast
from backend.services.fraud_service import get_fraud_insights


def _clamp(value: float, min_v: float, max_v: float) -> float:
    return max(min_v, min(max_v, value))


def run_simulation(
    db: Session,
    sales_growth_multiplier: float,
    expense_growth_multiplier: float,
    fraud_sensitivity: float,
    supplier_delay_factor: float,
    reorder_threshold_multiplier: float,
) -> Dict[str, Any]:
    """
    Run an in-memory what-if simulation based on the latest data snapshots.

    This function is read-only: it never mutates database state or cached snapshots.
    """
    # --- Baseline metrics from existing services --------------------------------
    base_health = get_health_score()
    base_health_score = float(base_health.get("score", 70))

    expense_summary = get_expense_summary(db)
    base_expense_total = float(expense_summary.get("total", 0.0))

    fraud_insights = get_fraud_insights(db)
    anomalies = float(fraud_insights.get("anomalies_detected", 0) or 0)
    total_tx = float(fraud_insights.get("total_transactions", 0) or 0)
    fraud_rate = (anomalies / total_tx * 100.0) if total_tx > 0 else 0.0

    inventory_forecast = get_inventory_forecast(db)

    # --- Derived baseline financials -------------------------------------------
    # Approximate baseline revenue from expenses (very lightweight heuristic).
    # If there is no expense data yet, assume a synthetic baseline.
    if base_expense_total > 0:
        base_revenue0 = base_expense_total * 1.4
    else:
        base_revenue0 = 80_000.0

    # Build a simple 4-period revenue forecast and apply the sales growth lever.
    base_revenue_series: List[float] = []
    for i in range(4):
        # 3% organic growth per period as a baseline
        growth_factor = 1.0 + 0.03 * i
        base_revenue_series.append(base_revenue0 * growth_factor)

    simulated_revenue_series: List[float] = [
        v * sales_growth_multiplier for v in base_revenue_series
    ]

    # --- Expense & cash-flow impact -------------------------------------------
    simulated_expense_total = base_expense_total * expense_growth_multiplier
    # Assume a simple rolling 4-period horizon for cash projection
    revenue_sum = sum(simulated_revenue_series)
    expense_sum = simulated_expense_total * 4.0

    # Synthetic starting cash buffer – this is only for simulation purposes.
    base_cash_buffer = 100_000.0
    projected_cash = base_cash_buffer + revenue_sum - expense_sum

    # --- Risk Index calculation ------------------------------------------------
    # Start from fraud risk signal and modulate with fraud_sensitivity.
    fraud_component = fraud_rate * (0.6 * fraud_sensitivity)

    # Inventory / supply-chain risk from delay factor and reorder policy.
    inventory_component = (supplier_delay_factor - 1.0) * 40.0 + (
        reorder_threshold_multiplier - 1.0
    ) * 25.0

    # Cost pressure: higher expense growth increases risk.
    expense_component = (expense_growth_multiplier - 1.0) * 60.0

    raw_risk_index = fraud_component + inventory_component + expense_component
    risk_index = _clamp(raw_risk_index, 0.0, 100.0)

    # --- Health Score adjustment ----------------------------------------------
    # Start from the current health score and gently nudge it based on:
    #   - revenue growth vs. expense growth
    #   - overall risk index
    #   - supplier delays
    revenue_vs_expense_delta = (sales_growth_multiplier - expense_growth_multiplier) * 18.0

    # Higher risk index drags the score down.
    risk_delta = -((risk_index - 40.0) / 4.5)

    # Supplier delays directly penalize operational health.
    supplier_delta = -(supplier_delay_factor - 1.0) * 10.0

    health_delta = revenue_vs_expense_delta + risk_delta + supplier_delta
    new_health_score = _clamp(base_health_score + health_delta, 0.0, 100.0)
    delta_from_base = new_health_score - base_health_score

    # --- Build explanation summary --------------------------------------------
    explanation_parts = []
    if sales_growth_multiplier != 1.0:
        if sales_growth_multiplier > 1.0:
            explanation_parts.append(
                f"Sales growth increased by {round((sales_growth_multiplier - 1.0) * 100, 1)}%, "
                f"lifting revenue forecasts across the horizon."
            )
        else:
            explanation_parts.append(
                f"Sales growth reduced by {round((1.0 - sales_growth_multiplier) * 100, 1)}%, "
                f"compressing revenue forecasts."
            )
    if expense_growth_multiplier != 1.0:
        if expense_growth_multiplier > 1.0:
            explanation_parts.append(
                f"Operating expenses are projected to grow by "
                f"{round((expense_growth_multiplier - 1.0) * 100, 1)}%, "
                f"reducing projected cash and health."
            )
        else:
            explanation_parts.append(
                f"Operating expenses are tightened by "
                f"{round((1.0 - expense_growth_multiplier) * 100, 1)}%, "
                f"supporting stronger cash generation."
            )
    if fraud_sensitivity != 1.0:
        explanation_parts.append(
            f"Fraud sensitivity set to {fraud_sensitivity:.2f} adjusts how strongly "
            f"fraud findings influence the unified risk index."
        )
    if supplier_delay_factor != 1.0 or reorder_threshold_multiplier != 1.0:
        explanation_parts.append(
            "Supply-chain levers (supplier delays and reorder thresholds) "
            "change inventory risk and slightly impact overall health."
        )

    if not explanation_parts:
        explanation_summary = (
            "Simulation uses current health, fraud and expense signals to project revenue, "
            "cash and risk over the next four periods without changing underlying data."
        )
    else:
        explanation_summary = " ".join(explanation_parts)

    # --- Shape response -------------------------------------------------------
    revenue_forecast = [
        {"period": f"P{i+1}", "value": round(val, 2)}
        for i, val in enumerate(simulated_revenue_series)
    ]

    return {
        "new_health_score": round(new_health_score, 1),
        "delta_from_base": round(delta_from_base, 1),
        "projected_cash": round(projected_cash, 2),
        "risk_index": round(risk_index, 1),
        "revenue_forecast": revenue_forecast,
        "explanation_summary": explanation_summary,
        # Lightweight metadata to support explainability in the UI
        "metadata": {
            "base_health_score": round(base_health_score, 1),
            "base_expense_total": round(base_expense_total, 2),
            "fraud_rate_percent": round(fraud_rate, 1),
        },
    }

