from sqlalchemy import Column, Integer, String
from database import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    delivery_score = Column(Integer, nullable=False, default=3)
    quality_score = Column(Integer, nullable=False, default=3)
    price_score = Column(Integer, nullable=False, default=3)

