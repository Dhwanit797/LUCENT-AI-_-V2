# Rule-based recommendation engine: fraud, expense, inventory, green-grid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models.fraud import FraudRecord
from backend.models.expense import ExpenseItem
from backend.models.inventory import InventoryItem
from backend.models.green_grid import GreenGridRecord


def get_fraud_recommendations() -> List[Dict[str, Any]]:
    """Vendor audit if fraud count high."""
    recs = []
    try:
        db: Session = SessionLocal()
        try:
            total = db.query(FraudRecord).count()
            fraud_count = db.query(FraudRecord).filter(FraudRecord.is_fraud == True).count()
            if total == 0:
                return []
            fraud_pct = (fraud_count / total) * 100 if total > 0 else 0

            if fraud_count > 20 or fraud_pct > 30:
                recs.append({
                    "severity": "critical",
                    "title": "Immediate Vendor Audit Required",
                    "message": f"{fraud_count} fraudulent transactions detected ({fraud_pct:.1f}% of total). Conduct a full vendor audit and suspend high-risk accounts immediately.",
                })
            elif fraud_count > 10 or fraud_pct > 15:
                recs.append({
                    "severity": "high",
                    "title": "Vendor Review Recommended",
                    "message": f"{fraud_count} flagged transactions found ({fraud_pct:.1f}%). Review vendor contracts and enable stricter transaction approval thresholds.",
                })
            elif fraud_count > 3 or fraud_pct > 5:
                recs.append({
                    "severity": "medium",
                    "title": "Monitor Suspicious Transactions",
                    "message": f"{fraud_count} anomalies detected ({fraud_pct:.1f}%). Enable real-time alerts and increase monitoring frequency for flagged vendors.",
                })
            else:
                recs.append({
                    "severity": "low",
                    "title": "Fraud Risk Within Normal Range",
                    "message": f"Only {fraud_count} flagged transactions ({fraud_pct:.1f}%). Maintain current monitoring cadence and review quarterly.",
                })
        finally:
            db.close()
    except Exception:
        pass
    return recs


def get_expense_recommendations() -> List[Dict[str, Any]]:
    """Cost optimization if monthly increase > 20%."""
    recs = []
    try:
        db: Session = SessionLocal()
        try:
            items = db.query(ExpenseItem).all()
            if not items:
                return []

            # Group by month, calculate totals
            month_totals: Dict[str, float] = {}
            for item in items:
                month = item.month or "Unknown"
                month_totals[month] = month_totals.get(month, 0) + float(item.amount)

            if len(month_totals) < 2:
                # Single month data: just check total
                total = sum(month_totals.values())
                if total > 100000:
                    recs.append({
                        "severity": "medium",
                        "title": "High Expense Volume Detected",
                        "message": f"Total monthly expenses of ${total:,.0f} are elevated. Review category breakdown and identify optimization opportunities.",
                    })
                return recs

            months_sorted = sorted(month_totals.keys())
            increases = []
            for i in range(1, len(months_sorted)):
                prev = month_totals[months_sorted[i - 1]]
                curr = month_totals[months_sorted[i]]
                if prev > 0:
                    pct_change = ((curr - prev) / prev) * 100
                    increases.append((months_sorted[i], pct_change, curr))

            high_increases = [x for x in increases if x[1] > 20]
            moderate_increases = [x for x in increases if 10 < x[1] <= 20]

            if high_increases:
                worst = max(high_increases, key=lambda x: x[1])
                recs.append({
                    "severity": "high",
                    "title": "Cost Spike — Optimization Needed",
                    "message": f"Expenses in {worst[0]} surged {worst[1]:.1f}% (${worst[2]:,.0f}). Identify high-spend categories and negotiate vendor contracts to reduce overhead.",
                })
            if moderate_increases:
                worst_mod = max(moderate_increases, key=lambda x: x[1])
                recs.append({
                    "severity": "medium",
                    "title": "Rising Expense Trend",
                    "message": f"Expenses grew {worst_mod[1]:.1f}% in {worst_mod[0]}. Consider budget caps for discretionary categories and review recurring subscriptions.",
                })
            if not high_increases and not moderate_increases:
                recs.append({
                    "severity": "low",
                    "title": "Expenses Trending Stable",
                    "message": "Monthly expense growth is within healthy range (<10%). Continue monitoring and run a quarterly spend review.",
                })
        finally:
            db.close()
    except Exception:
        pass
    return recs


def get_inventory_recommendations() -> List[Dict[str, Any]]:
    """Reduce reorder rate if turnover slowing."""
    recs = []
    try:
        db: Session = SessionLocal()
        try:
            items = db.query(InventoryItem).all()
            if not items:
                return []

            reorder_threshold = 30
            low_stock_items = [i for i in items if i.quantity < reorder_threshold]
            very_low_items = [i for i in items if i.quantity < 10]
            over_stock_items = [i for i in items if i.quantity > 200]

            low_pct = (len(low_stock_items) / len(items)) * 100 if items else 0

            if very_low_items:
                names = ", ".join(i.item_name for i in very_low_items[:3])
                recs.append({
                    "severity": "critical",
                    "title": "Critical Stock Depletion Risk",
                    "message": f"{len(very_low_items)} items near zero stock: {names}. Place emergency reorders immediately to prevent operational disruption.",
                })
            if low_pct > 40:
                recs.append({
                    "severity": "high",
                    "title": "High Reorder Frequency Detected",
                    "message": f"{len(low_stock_items)} items ({low_pct:.0f}%) are below reorder threshold. Turnover may be slowing — consider reducing reorder quantities and reassessing safety stock levels.",
                })
            elif low_pct > 20:
                recs.append({
                    "severity": "medium",
                    "title": "Inventory Replenishment Needed",
                    "message": f"{len(low_stock_items)} items below reorder point. Review supplier lead times and adjust min-max thresholds to optimize carrying costs.",
                })
            if over_stock_items:
                names = ", ".join(i.item_name for i in over_stock_items[:3])
                recs.append({
                    "severity": "low",
                    "title": "Overstock Identified",
                    "message": f"{len(over_stock_items)} items overstocked (>200 units): {names}. Reduce reorder rate to free up working capital and warehouse space.",
                })
            if not recs:
                recs.append({
                    "severity": "low",
                    "title": "Inventory Levels Healthy",
                    "message": f"All {len(items)} tracked items are within optimal stock range. No immediate reorders required.",
                })
        finally:
            db.close()
    except Exception:
        pass
    return recs


def get_green_grid_recommendations() -> List[Dict[str, Any]]:
    """Reduce high carbon categories."""
    recs = []
    try:
        db: Session = SessionLocal()
        try:
            records = db.query(GreenGridRecord).all()
            if not records:
                return []

            usages = [float(r.usage_kwh) for r in records]
            avg_usage = sum(usages) / len(usages) if usages else 0
            max_usage = max(usages) if usages else 0
            peak_records = [r for r in records if float(r.usage_kwh) > avg_usage * 1.4]
            high_carbon_threshold = avg_usage * 1.6

            if max_usage > high_carbon_threshold:
                recs.append({
                    "severity": "high",
                    "title": "High Carbon Emission Period Detected",
                    "message": f"Peak consumption of {max_usage:.1f} kWh exceeds safe threshold by {((max_usage / avg_usage - 1) * 100):.0f}%. Shift high-load processes to off-peak hours and audit high-carbon equipment categories.",
                })
            if len(peak_records) > len(records) * 0.3:
                recs.append({
                    "severity": "medium",
                    "title": "Frequent Off-Peak Overrun",
                    "message": f"{len(peak_records)} of {len(records)} hours exceed 40% above average usage. Enable automated load-balancing and consider renewable energy sourcing for peak hours.",
                })
            if avg_usage > 80:
                recs.append({
                    "severity": "medium",
                    "title": "Baseline Energy Consumption Elevated",
                    "message": f"Average hourly usage of {avg_usage:.1f} kWh is high. Review HVAC, lighting, and server room efficiency. A smart thermostat schedule could reduce baseline by 10–15%.",
                })
            if not recs:
                recs.append({
                    "severity": "low",
                    "title": "Energy Profile Optimized",
                    "message": f"Average consumption of {avg_usage:.1f} kWh/hr is within sustainable range. Continue monitoring and target a 5% quarterly reduction.",
                })
        finally:
            db.close()
    except Exception:
        pass
    return recs
