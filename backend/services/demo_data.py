# Create demo user on startup. Vendors and Products come only from Smart Inventory CSV upload.
from backend.database import SessionLocal
from backend.models.user import User
from backend.core.security import get_password_hash


def init_db():
    db = SessionLocal()
    try:
        # Create Demo User only. Vendors/Products are populated from inventory CSV upload.
        if db.query(User).filter(User.email == "demo@business.ai").first() is None:
            demo = User(
                email="demo@business.ai",
                hashed_password=get_password_hash("demo123"),
                full_name="Demo User",
            )
            db.add(demo)

        db.commit()
    finally:
        db.close()
