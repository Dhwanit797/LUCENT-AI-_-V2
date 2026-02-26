# SQLite database setup
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.core.config import DATABASE_URL

Base = declarative_base()

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
