# FastAPI app: CORS, routers, demo data init
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine
from database import Base
from core.config import CORS_ORIGINS
from services.demo_data import init_db
from models.user import User  # IMPORTED SO SQLALCHEMY DETECTS IT
from models.inventory import InventoryItem
from models.expense import ExpenseItem
from models.fraud import FraudRecord
from models.green_grid import GreenGridRecord
from models.vendor import Vendor
from models.product import Product
from routers import (
    auth,
    expense,
    fraud,
    inventory,
    green_grid,
    health,
    recommendations,
    carbon,
    report,
    chat,
    ai,
    vendors,
    products,
    simulation,
    revenue_intelligence,
    unified_risk,
)

app = FastAPI(title="Lucent AI API", version="1.0.0")

origins = (
    ["*"]
    if CORS_ORIGINS == "*"
    else [origin.strip() for origin in CORS_ORIGINS.split(",") if origin.strip()]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables and demo user
Base.metadata.create_all(bind=engine)
init_db()

app.include_router(auth.router)
app.include_router(expense.router)
app.include_router(fraud.router)
app.include_router(inventory.router)
app.include_router(green_grid.router)
app.include_router(health.router)
app.include_router(recommendations.router)
app.include_router(carbon.router)
app.include_router(report.router)
app.include_router(chat.router)
app.include_router(ai.router)
app.include_router(vendors.router)
app.include_router(products.router)
app.include_router(simulation.router)
app.include_router(revenue_intelligence.router)
app.include_router(unified_risk.router)


@app.get("/health")
def api_health():
    return {"status": "ok"}
