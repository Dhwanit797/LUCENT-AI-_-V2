# Create demo user and seed data on startup
from database import SessionLocal
from models.user import User
from models.vendor import Vendor
from models.product import Product
from core.security import get_password_hash


def init_db():
    db = SessionLocal()
    try:
        # 1. Create Demo User
        if db.query(User).filter(User.email == "demo@business.ai").first() is None:
            demo = User(
                email="demo@business.ai",
                hashed_password=get_password_hash("demo123"),
                full_name="Demo User",
            )
            db.add(demo)
            
        # 2. Create Demo Vendors
        if db.query(Vendor).count() == 0:
            mock_vendors = [
                Vendor(name="ABC Supplies", delivery_score=4, quality_score=5, price_score=4),
                Vendor(name="Metro Traders", delivery_score=5, quality_score=4, price_score=5),
                Vendor(name="Swift Logistics", delivery_score=3, quality_score=3, price_score=3),
                Vendor(name="Global Sourcing", delivery_score=5, quality_score=5, price_score=2)
            ]
            db.add_all(mock_vendors)
            
        # 3. Create Demo Products
        if db.query(Product).count() == 0:
            mock_products = [
                Product(name="Product A", available_quantity=120, total_sold=340),
                Product(name="Product B", available_quantity=50, total_sold=10),
                Product(name="Product C", available_quantity=500, total_sold=800),
                Product(name="Product D", available_quantity=0, total_sold=450),
                Product(name="Product E", available_quantity=200, total_sold=200)
            ]
            db.add_all(mock_products)

        db.commit()
    finally:
        db.close()
