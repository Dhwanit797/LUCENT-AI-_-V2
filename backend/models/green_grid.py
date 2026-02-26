from sqlalchemy import Column, Integer, String, Float
from backend.database import Base

class GreenGridRecord(Base):
    __tablename__ = "green_grid_records"

    id = Column(Integer, primary_key=True, index=True)
    hour = Column(String)
    usage_kwh = Column(Float)
