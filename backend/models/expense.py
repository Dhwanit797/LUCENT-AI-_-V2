from sqlalchemy import Column, Integer, String, Float
from backend.database import Base

class ExpenseItem(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)
    amount = Column(Float)
    month = Column(String)
