# JWT and password hashing
from datetime import datetime, timedelta
from typing import Optional
import hashlib

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------
# Password normalization (fixes bcrypt 72-byte limit permanently)
# ---------------------------------------------------------------------
def _normalize_password(password: str) -> bytes:
    """
    Convert password to fixed-length high-entropy bytes using SHA-256.
    This avoids bcrypt's 72-byte input limitation.
    """
    return hashlib.sha256(password.encode("utf-8")).digest()


# ---------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------
def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(_normalize_password(plain), hashed)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return pwd_context.hash(_normalize_password(password))


# ---------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------
def create_access_token(
    data: dict, expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ---------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload