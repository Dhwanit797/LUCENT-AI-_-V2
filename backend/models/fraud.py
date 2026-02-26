from sqlalchemy import Column, Integer, String, Boolean
from database import Base

class FraudRecord(Base):
    __tablename__ = "fraud_records"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    amount = Column(Integer)
    is_fraud = Column(Boolean, default=False)
