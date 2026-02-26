from sqlalchemy import Column, Integer, String, Float
from backend.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    price = Column(Float, nullable=False, default=0.0)
