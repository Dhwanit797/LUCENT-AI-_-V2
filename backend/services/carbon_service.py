# Carbon Footprint Estimator (rule-based)
import random
from typing import Dict, Any


def get_carbon_estimate() -> Dict[str, Any]:
    kg_co2 = round(random.uniform(1200, 2800), 0)
    equivalent = "~{} trees/year".format(round(kg_co2 / 22))
    return {
        "kg_co2_per_year": kg_co2,
        "equivalent": equivalent,
        "rating": "good" if kg_co2 < 2000 else "moderate",
        "suggestions": [
            "Use renewable energy for office",
            "Reduce business travel",
            "Optimize logistics routes",
        ],
    }
