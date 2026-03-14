from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt
from datetime import datetime, timedelta
import jwt
import os

from ..database import get_db
from ..models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY   = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM    = "HS256"
TOKEN_EXPIRE = timedelta(days=30)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class RegisterRequest(BaseModel):
    display_name:    str
    email:           EmailStr
    password:        str
    country:         Optional[str] = "South Africa"
    currency_code:   Optional[str] = "ZAR"
    currency_symbol: Optional[str] = "R"


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    return jwt.encode(
        {"sub": user_id, "exp": datetime.utcnow() + TOKEN_EXPIRE},
        SECRET_KEY, algorithm=ALGORITHM
    )

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register", status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user = User(
        email           = data.email,
        hashed_password = hash_password(data.password),
        display_name    = data.display_name.strip(),
        country         = data.country,
        currency_code   = data.currency_code,
        currency_symbol = data.currency_symbol,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {
        "id":              str(user.id),
        "email":           user.email,
        "display_name":    user.display_name,
        "country":         user.country,
        "currency_code":   user.currency_code,
        "currency_symbol": user.currency_symbol,
    }


@router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form.username))
    user   = result.scalar_one_or_none()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": create_token(str(user.id)), "token_type": "bearer"}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id":              str(current_user.id),
        "email":           current_user.email,
        "display_name":    current_user.display_name,
        "country":         current_user.country,
        "currency_code":   current_user.currency_code,
        "currency_symbol": current_user.currency_symbol,
    }
