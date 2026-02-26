# Business Health Score: composite from expense, fraud, inventory, green
import random
from typing import Dict, Any


def get_health_score() -> Dict[str, Any]:
    score = random.randint(62, 92)
    if score >= 80:
        level = "excellent"
        color = "green"
    elif score >= 65:
        level = "good"
        color = "blue"
    elif score >= 50:
        level = "fair"
        color = "yellow"
    else:
        level = "needs_attention"
        color = "red"
    return {
        "score": score,
        "level": level,
        "color": color,
        "factors": [
            {"name": "Cash flow", "score": min(100, score + random.randint(-10, 10))},
            {"name": "Fraud risk", "score": min(100, 100 - (100 - score) + random.randint(-5, 5))},
            {"name": "Inventory", "score": min(100, score + random.randint(-8, 8))},
            {"name": "Sustainability", "score": min(100, score + random.randint(-12, 12))},
        ],
    }
