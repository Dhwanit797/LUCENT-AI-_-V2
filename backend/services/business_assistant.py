# Business Assistant: contextual responses using real module metrics
from typing import Any, Dict, List


def generate_business_response(question: str, module_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a structured response using real metrics from module data."""
    q = question.lower().strip()
    metrics = module_data or {}

    health = metrics.get("health") or {}
    expense = metrics.get("expense") or {}
    fraud = metrics.get("fraud") or {}
    inventory = metrics.get("inventory") or {}
    green_grid = metrics.get("green_grid") or {}
    carbon = metrics.get("carbon") or {}
    recommendations = metrics.get("recommendations") or []

    # Helper: a module has real data if it was fetched (not None)
    has_expense = metrics.get("expense") is not None
    has_fraud = metrics.get("fraud") is not None
    has_inventory = metrics.get("inventory") is not None
    has_green = metrics.get("green_grid") is not None

    answer_parts: List[str] = []
    metrics_used: List[str] = []

    if any(w in q for w in ("expense", "spend", "cost", "budget")):
        if has_expense and expense.get("total", 0) > 0:
            total = expense.get("total", 0)
            trend = expense.get("trend", "stable")
            trend_pct = expense.get("trend_percent", 0)
            by_cat = expense.get("by_category", [])
            top = sorted(by_cat, key=lambda x: x.get("value", 0), reverse=True)[:3]
            parts = [f"**Total expenses:** ${total:,.2f} (trend: {trend}, {trend_pct:+.1f}%)"]
            if top:
                parts.append("**Top categories:** " + ", ".join(
                    f"{c.get('name', '')} (${c.get('value', 0):,.2f})" for c in top
                ))
            answer_parts.append("\n\n".join(parts))
            metrics_used.append("expense")
        else:
            answer_parts.append(
                "No expense data has been uploaded yet. Go to **Expense Sense** and upload a CSV with columns: `category`, `amount`, `month` to get spending insights."
            )

    elif any(w in q for w in ("fraud", "risk", "anomal", "threat", "suspicious")):
        if has_fraud and fraud.get("total_transactions", 0) > 0:
            anomalies = fraud.get("anomalies_detected", 0)
            total_tx = fraud.get("total_transactions", 0)
            risk = fraud.get("risk_level", "unknown")
            pct = round((anomalies / total_tx * 100) if total_tx > 0 else 0, 1)
            answer_parts.append(
                f"**Fraud risk level:** {risk.upper()}\n\n{anomalies} anomalies detected out of {total_tx} transactions ({pct}% fraud rate)."
            )
            metrics_used.append("fraud")
        else:
            answer_parts.append(
                "No transaction data has been uploaded yet. Go to **Fraud Lens** and upload a CSV with columns: `transaction_id`, `amount`, `is_fraud` to run anomaly detection."
            )

    elif any(w in q for w in ("inventory", "stock", "reorder", "item", "product")):
        if has_inventory and inventory.get("items"):
            low = inventory.get("low_stock_count", 0)
            items = inventory.get("items", [])
            low_items = [i for i in items if i.get("stock", 0) <= i.get("reorder_at", 0)][:5]
            parts = [f"**Total items tracked:** {len(items)} | **Low stock items:** {low}"]
            if low_items:
                parts.append("**Needs reordering:** " + ", ".join(
                    f"{i.get('name', '')} ({i.get('stock', 0)} left)" for i in low_items
                ))
            else:
                parts.append("All items are well-stocked.")
            answer_parts.append("\n\n".join(parts))
            metrics_used.append("inventory")
        else:
            answer_parts.append(
                "No inventory data has been uploaded yet. Go to **Smart Inventory** and upload a CSV with columns: `item_name`, `category`, `quantity`, `price` to track stock levels."
            )

    elif any(w in q for w in ("health", "score", "overall", "performance")):
        if health:
            score = health.get("score", 0)
            level = health.get("level", "unknown")
            factors = health.get("factors", [])
            parts = [f"**Business health score:** {score}/100 ({level})"]
            if factors:
                parts.append("**Factors:** " + ", ".join(
                    f"{f.get('name', '')}: {f.get('score', 0)}" for f in factors
                ))
            answer_parts.append("\n\n".join(parts))
            metrics_used.append("health")
        else:
            answer_parts.append("Health score aggregates data from all modules. Upload data to each module to improve your score.")

    elif any(w in q for w in ("carbon", "sustainab", "emission", "co2", "footprint")):
        if carbon:
            kg = carbon.get("kg_co2_per_year", 0)
            equiv = carbon.get("equivalent", "")
            rating = carbon.get("rating", "")
            answer_parts.append(f"**Carbon footprint:** {kg:,.0f} kg CO₂/yr\n\n{equiv}. Rating: **{rating}**")
            metrics_used.append("carbon")
        else:
            answer_parts.append("Carbon estimates are derived from your energy data. Upload data to Green Grid for sustainability insights.")

    elif any(w in q for w in ("green", "energy", "power", "electric", "kwh")):
        if has_green and green_grid.get("current_usage_kwh", 0) > 0:
            usage = green_grid.get("current_usage_kwh", 0)
            savings = green_grid.get("potential_savings_percent", 0)
            recs = green_grid.get("recommendations", [])
            parts = [f"**Average energy usage:** {usage:.2f} kWh\n\n**Potential savings:** {savings:.1f}%"]
            if recs:
                parts.append("**Recommendations:** " + "; ".join(recs[:2]))
            answer_parts.append("\n\n".join(parts))
            metrics_used.append("green_grid")
        else:
            answer_parts.append(
                "No energy data uploaded yet. Go to **Green Grid** and upload a CSV with columns: `hour`, `usage_kwh` to get energy insights."
            )

    elif any(w in q for w in ("recommend", "suggest", "advice", "tip", "improve")):
        if recommendations:
            parts = [f"**{len(recommendations)} AI recommendations:**"]
            for r in recommendations[:5]:
                title = r.get('title', '')
                priority = r.get('priority', '')
                parts.append(f"• **{title}** ({priority} priority)")
            answer_parts.append("\n\n".join(parts))
            metrics_used.append("recommendations")
        else:
            answer_parts.append("No recommendations available yet. Upload data to each module to generate AI-powered recommendations.")

    elif any(w in q for w in ("hello", "hi", "hey", "help")):
        answer_parts.append(
            "Hello! I'm your **Business AI Assistant**.\n\nI can answer questions about:\n"
            "• 💰 **Expenses** — spending breakdown and trends\n"
            "• 🛡️ **Fraud** — anomaly detection and risk level\n"
            "• 📦 **Inventory** — stock levels and reorder alerts\n"
            "• 📊 **Health Score** — overall business performance\n"
            "• 🌱 **Energy** — consumption and sustainability\n"
            "• 💡 **Recommendations** — AI-powered action items\n\n"
            "Upload data to each module to unlock real insights."
        )

    else:
        # Generic overview — only show modules with real data
        summary_parts = []
        if health:
            summary_parts.append(f"**Health score:** {health.get('score', 0)}/100")
        if has_expense and expense.get("total", 0) > 0:
            summary_parts.append(f"**Total expenses:** ${expense.get('total', 0):,.2f}")
        if has_fraud and fraud.get("total_transactions", 0) > 0:
            summary_parts.append(f"**Fraud risk:** {fraud.get('risk_level', 'N/A')} ({fraud.get('anomalies_detected', 0)} anomalies)")
        if has_inventory and inventory.get("items"):
            summary_parts.append(f"**Low stock items:** {inventory.get('low_stock_count', 0)}")
        if has_green and green_grid.get("current_usage_kwh", 0) > 0:
            summary_parts.append(f"**Avg energy:** {green_grid.get('current_usage_kwh', 0):.1f} kWh")

        if summary_parts:
            answer_parts.append("**Quick overview:**\n\n" + "\n".join(summary_parts))
        else:
            answer_parts.append(
                "No module data uploaded yet. Upload CSV files to **Expense Sense**, **Fraud Lens**, **Smart Inventory**, or **Green Grid** to get real insights."
            )

        answer_parts.append(
            "You can ask me about: expenses, fraud risks, inventory stock, business health score, energy usage, or recommendations."
        )

    content = "\n\n".join(answer_parts) if answer_parts else (
        "I can help with your business metrics. Try asking about expenses, fraud, inventory, or health score."
    )
    return {
        "answer": content,
        "metrics_used": metrics_used,
    }
