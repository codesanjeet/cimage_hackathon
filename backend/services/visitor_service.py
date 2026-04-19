import random
import string
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from models import Visitor, Blacklist, Alert, User
from schemas.visitor import VisitorRegister
from mailer import send_approval_email, send_rejection_email


def generate_otp(length=6) -> str:
    return "".join(random.choices(string.digits, k=length))


async def register_visitor(db: AsyncSession, data: VisitorRegister) -> Visitor:
    # Check blacklist
    blacklist_result = await db.execute(
        select(Blacklist).where(Blacklist.phone == data.phone)
    )
    blacklisted = blacklist_result.scalar_one_or_none()

    visitor = Visitor(
        name=data.name,
        email=data.email,
        phone=data.phone,
        purpose=data.purpose,
        host_id=data.host_id,
        expected_minutes=data.expected_minutes,
        status="pending",
    )
    db.add(visitor)
    await db.flush()

    if blacklisted:
        # Store blacklist alert
        alert = Alert(
            visitor_id=visitor.id,
            type="blacklist",
            message=f"Visitor {data.name} ({data.phone}) is on the blacklist. Reason: {blacklisted.reason}",
        )
        db.add(alert)

    await db.commit()
    await db.refresh(visitor)
    return visitor


async def approve_visitor(db: AsyncSession, visitor_id: int) -> Visitor:
    result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
    visitor = result.scalar_one_or_none()
    if not visitor:
        return None

    otp = generate_otp()
    visitor.status = "approved"
    visitor.otp = otp
    await db.commit()
    await db.refresh(visitor)

    # Send OTP email if email present
    if visitor.email:
        await send_approval_email(visitor.email, visitor.name, otp)

    return visitor


async def reject_visitor(db: AsyncSession, visitor_id: int) -> Visitor:
    result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
    visitor = result.scalar_one_or_none()
    if not visitor:
        return None

    visitor.status = "rejected"
    await db.commit()
    await db.refresh(visitor)

    if visitor.email:
        await send_rejection_email(visitor.email, visitor.name)

    return visitor


async def checkin_visitor(db: AsyncSession, visitor_id: int, otp: str) -> tuple[Visitor | None, str]:
    result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
    visitor = result.scalar_one_or_none()

    if not visitor:
        return None, "Visitor not found"
    if visitor.status != "approved":
        return None, f"Visitor status is '{visitor.status}', must be 'approved'"
    if visitor.otp != otp:
        return None, "Invalid OTP"

    visitor.status = "inside"
    visitor.otp_verified = True
    visitor.check_in_time = datetime.utcnow()
    await db.commit()
    await db.refresh(visitor)
    return visitor, "Check-in successful"


async def checkout_visitor(db: AsyncSession, visitor_id: int) -> Visitor | None:
    result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
    visitor = result.scalar_one_or_none()

    if not visitor or visitor.status != "inside":
        return None

    visitor.status = "exited"
    visitor.check_out_time = datetime.utcnow()
    await db.commit()
    await db.refresh(visitor)
    return visitor


async def get_all_visitors(db: AsyncSession, status: str = None, search: str = None):
    query = select(Visitor)
    filters = []
    if status:
        filters.append(Visitor.status == status)
    if search:
        filters.append(
            or_(
                Visitor.name.ilike(f"%{search}%"),
                Visitor.phone.ilike(f"%{search}%"),
            )
        )
    if filters:
        query = query.where(and_(*filters))
    query = query.order_by(Visitor.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def get_visitor_by_id(db: AsyncSession, visitor_id: int) -> Visitor | None:
    result = await db.execute(select(Visitor).where(Visitor.id == visitor_id))
    return result.scalar_one_or_none()