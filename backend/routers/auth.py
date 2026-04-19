from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt
from datetime import datetime, timedelta
import bcrypt
from core.db import get_db
from models import User
from schemas.auth import LoginRequest, TokenResponse
from schemas.common import ResponseSchema
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["Authentication"])


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=ResponseSchema)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_token({"sub": str(user.id), "role": user.role, "email": user.email})

    return ResponseSchema(
        success=True,
        message="Login successful",
        data={"access_token": token, "token_type": "bearer", "role": user.role, "name": user.name},
    )


@router.post("/create-demo-users", response_model=ResponseSchema)
async def create_demo_users(db: AsyncSession = Depends(get_db)):
    """Seed default demo users for testing."""
    demo_users = [
        {"name": "Admin User", "email": "admin@campus.com", "password": "admin123", "role": "admin"},
        {"name": "Guard One", "email": "guard@campus.com", "password": "guard123", "role": "guard"},
        {"name": "Host User", "email": "host@campus.com", "password": "host123", "role": "host"},
    ]

    created = []
    for u in demo_users:
        existing = await db.execute(select(User).where(User.email == u["email"]))
        if existing.scalar_one_or_none():
            continue
        user = User(
            name=u["name"],
            email=u["email"],
            password_hash=hash_password(u["password"]),
            role=u["role"],
        )
        db.add(user)
        created.append(u["email"])

    await db.commit()
    return ResponseSchema(success=True, message="Demo users created", data={"created": created})