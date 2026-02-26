# AI Recommendation Engine: rule-based insights
import random
from typing import List, Dict, Any


def get_recommendations() -> List[Dict[str, Any]]:
    templates = [
        {"category": "expense", "icon": "trending_down", "title": "Reduce marketing spend", "priority": "high"},
        {"category": "fraud", "icon": "shield", "title": "Review 3 flagged transactions", "priority": "medium"},
        {"category": "inventory", "icon": "package", "title": "Reorder Widget A before stockout", "priority": "high"},
        {"category": "sustainability", "icon": "leaf", "title": "Shift 15% load to off-peak", "priority": "low"},
        {"category": "general", "icon": "lightbulb", "title": "Consider quarterly budget review", "priority": "medium"},
    ]
    selected = random.sample(templates, min(4, len(templates)))
    return [{"id": i, **t} for i, t in enumerate(selected)]
