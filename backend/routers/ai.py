from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from services.ai_service import analyze_visitor
from schemas.common import ResponseSchema

router = APIRouter(prefix="/ai", tags=["AI Analysis"])


@router.post("/analyze/{visitor_id}", response_model=ResponseSchema)
async def ai_analyze(visitor_id: int, db: AsyncSession = Depends(get_db)):
    result = await analyze_visitor(db, visitor_id)
    return ResponseSchema(success=True, message="AI analysis complete", data=result)