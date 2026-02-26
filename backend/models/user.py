# User model for SQLite
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from backend.database import Base  # noqa: I001


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
