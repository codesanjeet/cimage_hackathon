from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from schemas.common import ResponseSchema
from services.dashboard_service import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=ResponseSchema)
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    stats = await get_dashboard_stats(db)
    return ResponseSchema(success=True, message="Dashboard stats", data=stats)