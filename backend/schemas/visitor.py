from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class VisitorRegister(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    purpose: str
    host_id: int
    expected_minutes: Optional[int] = 60


class VisitorOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: str
    purpose: str
    host_id: int
    status: str
    otp: Optional[str]
    otp_verified: bool
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    expected_minutes: int
    created_at: datetime

    class Config:
        from_attributes = True


class CheckInRequest(BaseModel):
    otp: str


class BlacklistCreate(BaseModel):
    phone: str
    reason: Optional[str] = None