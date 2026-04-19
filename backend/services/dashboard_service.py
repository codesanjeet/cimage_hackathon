from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from models import Visitor


async def get_dashboard_stats(db: AsyncSession) -> dict:
    today_start = datetime.combine(date.today(), datetime.min.time())

    # Total visitors today
    total_result = await db.execute(
        select(func.count(Visitor.id)).where(Visitor.created_at >= today_start)
    )
    total_today = total_result.scalar() or 0

    # Active visitors (currently inside)
    active_result = await db.execute(
        select(func.count(Visitor.id)).where(Visitor.status == "inside")
    )
    active = active_result.scalar() or 0

    # Pending approvals
    pending_result = await db.execute(
        select(func.count(Visitor.id)).where(Visitor.status == "pending")
    )
    pending = pending_result.scalar() or 0

    # Overstayed: inside but exceeded expected_minutes
    now = datetime.utcnow()
    all_inside = await db.execute(
        select(Visitor).where(Visitor.status == "inside")
    )
    inside_visitors = all_inside.scalars().all()

    overstayed = 0
    for v in inside_visitors:
        if v.check_in_time:
            elapsed = (now - v.check_in_time).total_seconds() / 60
            if elapsed > v.expected_minutes:
                overstayed += 1

    return {
    "total_visitors_today": total_today,
    "active_inside": active,       
    "pending_approvals": pending,
    "overstayed": overstayed,      
}