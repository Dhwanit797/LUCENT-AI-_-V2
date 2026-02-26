import json
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from backend.services.health_score_service import get_health_score
from backend.services.expense_service import get_expense_summary
from backend.services.fraud_service import get_fraud_insights
from backend.services.inventory_service import get_inventory_summary
from backend.services.green_grid_service import get_green_grid_data, get_energy_chart_data
from backend.database import SessionLocal


_FRAUD_SNAPSHOT_PATH = Path(__file__).resolve().parent / "fraud_snapshot.json"


def generate_report_pdf() -> bytes:
    db = SessionLocal()
    try:
        health = get_health_score()
        expense = get_expense_summary(db)
        fraud = get_fraud_insights(db)
        inventory = get_inventory_summary(db)
        green = get_green_grid_data(db)
        energy_chart = get_energy_chart_data(db)
    finally:
        db.close()

    # Try to load the latest FraudLens engine snapshot so the PDF can reuse the
    # exact same risk scores and labels as the FraudLens module.
    fraud_snapshot = None
    try:
        if _FRAUD_SNAPSHOT_PATH.exists():
            fraud_snapshot = json.loads(_FRAUD_SNAPSHOT_PATH.read_text(encoding="utf-8"))
    except Exception:
        fraud_snapshot = None

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=inch, leftMargin=inch)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Lucent AI - Executive Summary", styles["Title"]))
    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph(f"Health Score: {health['score']}/100", styles["Heading2"]))
    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph(f"Total Expenses: ${expense['total']}", styles["Normal"]))
    story.append(Paragraph(f"Trend: {expense['trend']} ({expense['trend_percent']}%)", styles["Normal"]))
    story.append(Spacer(1, 0.3 * inch))

    # Health factors table
    data = [["Factor", "Score"]]
    for f in health["factors"]:
        data.append([f["name"], str(f["score"])])
    t = Table(data, colWidths=[3 * inch, 1.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTSIZE", (0, 0), (-1, 0), 12),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3 * inch))

    # Expense breakdown table (if data exists)
    if expense.get("by_category"):
        story.append(Paragraph("Expense Breakdown by Category", styles["Heading2"]))
        story.append(Spacer(1, 0.15 * inch))
        cat_data = [["Category", "Amount ($)"]]
        for cat in expense["by_category"]:
            cat_data.append([cat["name"], f"${cat['value']:,.2f}"])
        ct = Table(cat_data, colWidths=[3 * inch, 1.5 * inch])
        ct.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTSIZE", (0, 0), (-1, 0), 11),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
            ("BACKGROUND", (0, 1), (-1, -1), colors.lightblue),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        story.append(ct)

    # Fraud Lens section (if fraud data exists)
    if fraud.get("total_transactions", 0) > 0:
        story.append(Spacer(1, 0.4 * inch))
        story.append(Paragraph("Fraud Lens — Flagged Alerts", styles["Heading2"]))
        story.append(Spacer(1, 0.15 * inch))
        anomalies = fraud.get("anomalies_detected", 0)
        total_tx = fraud.get("total_transactions", 0)
        risk_level = fraud.get("risk_level", "none").title()
        story.append(Paragraph(
            f"Flagged transactions: {anomalies} of {total_tx} total · Overall risk level: {risk_level}",
            styles["Normal"],
        ))
        story.append(Spacer(1, 0.15 * inch))

        # Prefer the canonical FraudLens engine output when available so scores
        # match exactly what users see in the FraudLens UI.
        flagged_rows = []
        if fraud_snapshot and fraud_snapshot.get("transactions"):
            txs = fraud_snapshot.get("transactions") or []
            flagged_rows = [t for t in txs if t.get("risk_label") != "Safe"]
        else:
            alerts = fraud.get("alerts") or []
            for a in alerts:
                flagged_rows.append({
                    "transaction_id": a.get("id"),
                    "risk_label": a.get("type"),
                    # Convert existing 0–1 score back to a 0–100 scale
                    "risk_score": int(round(float(a.get("score", 0)) * 100)),
                })

        if flagged_rows:
            fraud_data = [["Transaction ID", "Classification", "Risk Score"]]
            for t in flagged_rows[:12]:
                try:
                    score_int = int(round(float(t.get("risk_score", 0))))
                except (TypeError, ValueError):
                    score_int = 0
                fraud_data.append([
                    str(t.get("transaction_id", "")),
                    str(t.get("risk_label", "")),
                    f"{score_int}%",
                ])
            ft = Table(fraud_data, colWidths=[2.6 * inch, 2.0 * inch, 1.0 * inch])
            ft.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTSIZE", (0, 0), (-1, 0), 11),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("BACKGROUND", (0, 1), (-1, -1), colors.lightblue),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ]))
            story.append(ft)

    # Smart Inventory section (if inventory data exists)
    items = inventory.get("items") or []
    if items:
        story.append(Spacer(1, 0.4 * inch))
        story.append(Paragraph("Smart Inventory — Low Stock Snapshot", styles["Heading2"]))
        story.append(Spacer(1, 0.15 * inch))

        # Derive low-stock items based on summary thresholds
        low_stock_rows = []
        for it in items:
            try:
                stock = int(it.get("stock", 0))
                reorder_at = int(it.get("reorder_at", 0))
            except (TypeError, ValueError):
                stock = 0
                reorder_at = 0
            if stock < reorder_at:
                low_stock_rows.append(it)

        inv_data = [["Item", "Category", "Stock", "Reorder At"]]
        source_rows = low_stock_rows or items
        for it in source_rows[:10]:
            inv_data.append([
                str(it.get("name", "")),
                str(it.get("category", "")),
                str(it.get("stock", "")),
                str(it.get("reorder_at", "")),
            ])
        itable = Table(inv_data, colWidths=[2.4 * inch, 1.6 * inch, 1.0 * inch, 1.0 * inch])
        itable.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTSIZE", (0, 0), (-1, 0), 11),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
            ("BACKGROUND", (0, 1), (-1, -1), colors.lightblue),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        story.append(itable)

    # Green Grid section (if energy data exists)
    if green.get("current_usage_kwh", 0) or energy_chart:
        story.append(Spacer(1, 0.4 * inch))
        story.append(Paragraph("Green Grid — Energy Overview", styles["Heading2"]))
        story.append(Spacer(1, 0.15 * inch))

        avg_usage = green.get("current_usage_kwh", 0)
        savings = green.get("potential_savings_percent", 0)
        shift = green.get("suggested_peak_shift", 0)
        story.append(Paragraph(
            f"Average usage: {avg_usage:.2f} kWh · Potential savings: {savings:.1f}% · Suggested peak shift: {shift:.1f}%",
            styles["Normal"],
        ))
        story.append(Spacer(1, 0.15 * inch))

        if energy_chart:
            grid_data = [["Period", "Usage (kWh)"]]
            for row in energy_chart[:16]:
                grid_data.append([
                    str(row.get("hour", "")),
                    f"{float(row.get('usage', 0)):.2f}",
                ])
            gtable = Table(grid_data, colWidths=[3 * inch, 1.5 * inch])
            gtable.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTSIZE", (0, 0), (-1, 0), 11),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("BACKGROUND", (0, 1), (-1, -1), colors.lightblue),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ]))
            story.append(gtable)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
