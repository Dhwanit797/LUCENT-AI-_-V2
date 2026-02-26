# AI Chat: rule-based responses (no external API)
import re
from typing import List, Dict, Any


RESPONSES = {
    "expense": "Based on your expense data, consider reviewing marketing and travel spend. Our Expense Sense module shows category breakdown.",
    "fraud": "Fraud Lens uses anomaly detection to flag unusual transactions. Check the Fraud Lens dashboard for current alerts.",
    "inventory": "Smart Inventory AI suggests reordering items below threshold. See the Inventory module for reorder suggestions.",
    "health": "Your Business Health Score combines cash flow, fraud risk, inventory, and sustainability. Aim for 80+ for excellent health.",
    "carbon": "The Carbon Footprint Estimator gives an annual CO2 estimate. Use Green Grid recommendations to reduce impact.",
    "report": "Use the Report Generator to download a PDF executive summary.",
    "hello": "Hello! I'm your Business AI assistant. Ask about expenses, fraud, inventory, sustainability, or reports.",
    "default": "I can help with expenses, fraud detection, inventory, sustainability, health score, and reports. What would you like to know?",
}


def get_chat_response(message: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
    msg_lower = message.lower().strip()
    reply = RESPONSES["default"]
    for key, response in RESPONSES.items():
        if key == "default":
            continue
        if key in msg_lower or (key == "hello" and msg_lower in ("hi", "hey", "hello")):
            reply = response
            break
    return {"role": "assistant", "content": reply}
