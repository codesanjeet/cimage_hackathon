from mailer import send_overstay_alert_email
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import Alert, Visitor, User



async def check_and_create_overstay_alerts(db: AsyncSession):
    """Run periodically to detect overstayed visitors and create alerts."""
    now = datetime.utcnow()

    result = await db.execute(select(Visitor).where(Visitor.status == "inside"))
    inside_visitors = result.scalars().all()

    created = 0
    for visitor in inside_visitors:
        if not visitor.check_in_time:
            continue

        elapsed_minutes = (now - visitor.check_in_time).total_seconds() / 60
        if elapsed_minutes <= visitor.expected_minutes:
            continue

        # Check if alert already exists (avoid duplicates)
        existing = await db.execute(
            select(Alert).where(
                Alert.visitor_id == visitor.id,
                Alert.type == "overstay",
                Alert.resolved == False,
            )
        )
        if existing.scalar_one_or_none():
            continue

        minutes_over = int(elapsed_minutes - visitor.expected_minutes)
        alert = Alert(
            visitor_id=visitor.id,
            type="overstay",
            message=f"Visitor {visitor.name} has overstayed by {minutes_over} minutes.",
        )
        db.add(alert)
        created += 1

        # Notify host
        host_result = await db.execute(select(User).where(User.id == visitor.host_id))
        host = host_result.scalar_one_or_none()
        if host and host.email and visitor.email:
            await send_overstay_alert_email(host.email, visitor.name, minutes_over)

    await db.commit()
    return created


async def get_all_alerts(db: AsyncSession):
    result = await db.execute(
        select(Alert).order_by(Alert.created_at.desc())
    )
    return result.scalars().all()


async def resolve_alert(db: AsyncSession, alert_id: int):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert:
        alert.resolved = True
        await db.commit()
    return alert