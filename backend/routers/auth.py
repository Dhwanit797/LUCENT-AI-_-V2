# Auth router: login, register, token, demo user
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models.user import User
from backend.core.security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = get_user_by_email(db, data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        token = create_access_token({"sub": user.email, "id": user.id})
        return TokenResponse(
            access_token=token,
            user={"email": user.email, "full_name": user.full_name or user.email},
        )
    except HTTPException:
        raise
    except Exception as e:
        print("LOGIN ERROR:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    try:
        if not data.full_name.strip():
            raise HTTPException(status_code=422, detail="Full name is required")
        if len(data.password) < 8:
            raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
        if get_user_by_email(db, data.email):
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        user = User(
            email=data.email.lower().strip(),
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name.strip(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_access_token({"sub": user.email, "id": user.id})
        return TokenResponse(
            access_token=token,
            user={"email": user.email, "full_name": user.full_name},
        )
    except HTTPException:
        raise
    except Exception as e:
        print("REGISTER ERROR:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
