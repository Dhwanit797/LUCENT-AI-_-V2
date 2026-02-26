import os
from pathlib import Path
from dotenv import load_dotenv

# Get project root directory (one level above backend)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env from project root
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY not set")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")