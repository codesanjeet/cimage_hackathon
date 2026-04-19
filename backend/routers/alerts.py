from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime

from core.db import get_db
from models import Alert, Visitor
from schemas.common import ResponseSchema
from services.alert_service import check_and_create_overstay_alerts, get_all_alerts, resolve_alert

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=ResponseSchema)
async def list_alerts(db: AsyncSession = Depends(get_db)):
    alerts = await get_all_alerts(db)
    data = [
        {
            "id": a.id,
            "visitor_id": a.visitor_id,
            "type": a.type,
            "message": a.message,
            "resolved": a.resolved,
            "created_at": a.created_at,
        }
        for a in alerts
    ]
    return ResponseSchema(success=True, message=f"{len(data)} alerts", data=data)


@router.post("/check-overstay", response_model=ResponseSchema)
async def trigger_overstay_check(db: AsyncSession = Depends(get_db)):
    """Manually trigger overstay detection (can be called by cron/guard)."""
    count = await check_and_create_overstay_alerts(db)
    return ResponseSchema(success=True, message=f"{count} new overstay alerts created")


@router.post("/{alert_id}/resolve", response_model=ResponseSchema)
async def resolve(alert_id: int, db: AsyncSession = Depends(get_db)):
    alert = await resolve_alert(db, alert_id)
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    return ResponseSchema(success=True, message="Alert resolved")