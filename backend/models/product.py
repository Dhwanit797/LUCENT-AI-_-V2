from sqlalchemy import Column, Integer, String
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    available_quantity = Column(Integer, nullable=False, default=0)
    total_sold = Column(Integer, nullable=False, default=0)

